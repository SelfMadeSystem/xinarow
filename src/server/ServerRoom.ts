import { PlayerColor } from "../share/PlayerColor";
import { ClientPackets, emitPacket, offPacket, onPacket, ServerPacketNames, ServerPackets } from "../share/Protocol";
import { Board } from "../share/Board";
import { SocketRef } from "./SocketReference";

function denyAction(socket: SocketRef, str: string) {
    emitPacket(socket, "actionReject", str);
}

export class ServerRoom {
    public readonly playerNames: string[] = [];
    public readonly board: Board;
    private sockets: SocketRef[] = [];
    public turn: number = 0;
    public started: boolean = false;
    private listeners: Map<SocketRef, Function> = new Map();
    public closeCb: () => void = () => { };
    public closed: boolean = false;

    constructor(
        public readonly roomName: string,
        public readonly playerCount = 1, // max is 8
        nInARow: number = 5,
        width: number | undefined = undefined,
        height: number | undefined = undefined,
    ) {
        this.board = new Board(nInARow, width, height);
    }

    private emit<Name extends ServerPacketNames>(name: Name,
        ...packet: (ClientPackets & ServerPackets)[Name]) {
        this.sockets.forEach(s => emitPacket(s, name, ...packet));
    }

    private emitAction(i: number, x: number, y: number) {
        this.emit("actionTaken", x, y, i);
    }

    private doAction(socket: SocketRef, i: number, x: number, y: number) {
        if (!this.started) {
            denyAction(socket, "The game has not started.");
            return;
        }
        if (this.turn !== i) {
            denyAction(socket, "It's not your turn.");
            return;
        }
        const result = this.board.setCell(x, y, i);
        if (result) {
            denyAction(socket, result);
            return;
        }
        this.emitAction(i, x, y);

        if (this.board.testWin(x, y, i)) {
            this.win(i);
            return;
        }

        if (this.board.isFull()) {
            this.end("Board full.");
            return;
        }

        this.turn = (this.turn + 1) % this.playerNames.length;
    }

    public open(socket: SocketRef, packet: ClientPackets["join"]) {
        if (this.started) {
            emitPacket(socket, "joinReject", "Game started.");
            return;
        }
        const i = this.sockets.length;
        if (i > this.playerCount) {
            emitPacket(socket, "joinReject", "Game full.");
            return;
        }
        try {
            const l = (x: number, y: number) => {
                this.doAction(socket, i, x, y);
            }
            this.listeners.set(socket, l);
            onPacket(socket, 'action', l);
            if (this.board.width === undefined || this.board.height === undefined) {
                emitPacket(socket, "joinAccept", i, this.board.nInARow, true);
            } else {
                emitPacket(socket, "joinAccept", i, this.board.nInARow, false, this.board.width, this.board.height);
            }
            this.playerNames.push(packet[1]);
            this.sockets.push(socket);

            socket.on('disconnect', () => {
                socket.callIfNotReplaced(() => {
                    if (this.closed) {
                        return;
                    }
                    this.end(`Player ${packet[1]} left.`);
                });
            });

            // TODO: on('disconnect', ...)

            this.emit("players", this.playerNames);

            if (this.sockets.length === this.playerCount) {
                this.start();
            }
        } catch (e) {
            console.error(e);
        }
    }

    public start() {
        if (this.started) {
            return;
        }
        this.started = true;
        this.emit('gameStarted');
        console.log("Game Started: ", this.roomName);
    }

    public win(color: PlayerColor) {
        this.emit("gameWon", color, this.board.winningLines);
        this.close();
    }

    public end(reason: string) {
        this.emit("gameEnd", reason);
        this.close();
    }

    public close() {
        this.closed = true;
        this.listeners.forEach((f, s) => {
            offPacket(s, 'action', f as any);
        });
        this.closeCb();
    }
}