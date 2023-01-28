import { Server } from 'socket.io';
import { emitPacket, onPacket, RoomOptions } from '../share/Protocol';
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
        console.log('a user connected. ip: ', s.handshake.address);

        socket.on('disconnect', () => {
            console.log('user disconnected ip: ', s.handshake.address);
        });

        onPacket(socket, 'join', (...packet) => {
            const roomName = packet[2];
            if (rooms.has(roomName)) {
                rooms.get(roomName)?.open(socket, packet);
            } else {
                emitPacket(socket, "joinReject", "Game not found.");
            }
        });

        onPacket(socket, 'create', (
            uid: string,
            username: string,
            roomName: string,
            options: RoomOptions) => {

            if (rooms.has(roomName)) {
                emitPacket(socket, "joinReject", "Room already exists.");
                return
            }

            const room = new ServerRoom(roomName, options);
            rooms.set(roomName, room);
            room.open(socket, [uid, username, roomName]);

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