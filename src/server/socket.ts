import { Server } from 'socket.io';
import { PlayerColor } from '../share/PlayerColor';
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
                emitPacket(socket, "joinReject", "Game not found.");
            }
        });

        onPacket(socket, 'create', (uid: string,
            username: string,
            roomName: string,
            nInARow: number,
            teamCount: PlayerColor,
            teamSize: number, // 1 for most games
            ...size: [
                infinite: true
            ] | [
                infinite: false,
                width: number,
                height: number,
            ]) => {

            if (rooms.has(roomName)) {
                emitPacket(socket, "joinReject", "Room already exists.");
                return
            }

            const room = (() => {
                if (size[0] === true) {
                    return new ServerRoom(roomName, teamCount, teamSize, nInARow);
                }
                const width = size[1];
                const height = size[2];
                return new ServerRoom(roomName, teamCount, teamSize, nInARow, width, height)
            })();
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