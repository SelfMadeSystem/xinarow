import { Server } from 'socket.io';
import { emitPacket, onPacket } from '../share/Protocol';
import { ServerRoom } from './ServerRoom';
import { SocketReferences } from './SocketReference';

const rooms: Map<string, ServerRoom> = new Map();

const refs: SocketReferences = new SocketReferences();

export default function socket(server?: any) {
    const io = new Server(server, {
        allowEIO3: true,
        cors: {
            origin: '*',
        },
    });

    io.on('connection', async (s) => {
        const socket = await refs.newSocket(s);

        if (socket === undefined) {
            return;
        }
        console.log('a user connected');

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        onPacket(socket, 'join', (...packet) => {
            const roomName = packet[2];
            if (rooms.has(roomName)) {
                rooms.get(roomName)?.open(socket, packet);
            } else {
                const room = new ServerRoom(roomName);
                rooms.set(roomName, room);
                room.open(socket, packet);

                const timeout = setTimeout(() => {
                    if (!room.started) room.start();
                }, 60 * 1000);

                room.closeCb = () => {
                    clearTimeout(timeout);
                    rooms.delete(roomName);
                    console.log("Game Ended: ", roomName)
                }
            }
        });

        onPacket(socket, 'create', (...packet) => {
            const roomName = packet[2];

            if (rooms.has(roomName)) {
                emitPacket(socket, "joinReject", "Room already exists.");
                return
            }

            const nInARow = packet[3];
            const playerCount = packet[4];
            const infinite = packet[5];

            const room = (() => {
                if (infinite) {
                    return new ServerRoom(roomName, playerCount, nInARow);
                }
                const width = packet[6];
                const height = packet[7];
                return new ServerRoom(roomName, playerCount, nInARow, width, height)
            })();
            rooms.set(roomName, room);
            room.open(socket, [packet[0], packet[1], packet[2]]);

            // const timeout = setTimeout(() => {
            //     if (!room.started) room.start();
            // }, 60 * 1000);

            room.closeCb = () => {
                // clearTimeout(timeout);
                rooms.delete(roomName);
                console.log("Game Ended: ", roomName)
            }
        });
    });

    return io;
}