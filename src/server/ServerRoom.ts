import { PlayerColor } from "../share/PlayerColor";
import { ClientPackets, emitPacket, offPacket, onPacket, RoomOptions, ServerPacketNames, ServerPackets } from "../share/Protocol";
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
        public readonly options: RoomOptions
    ) {
        this.board = new Board(options.nInARow, options.gravity,
            options.infinite ? undefined : options.width,
            options.infinite ? undefined : options.height,
            options.infinite ? undefined : options.expandLength,
            options.hex);
        console.log("Game created: " + roomName);
    }

    private emit<Name extends ServerPacketNames>(name: Name,
        ...packet: (ClientPackets & ServerPackets)[Name]) {
        this.sockets.forEach(s => emitPacket(s, name, ...packet));
    }

    private emitAction(color: number, x: number, y: number) {
        this.emit("actionTaken", x, y, color, this.turn);
    }

    private doAction(socket: SocketRef, i: number, x: number, y: number) {
        if (!this.started) {
            denyAction(socket, "The game has not started.");
            return;
        }
        if (!this.options.skipTurn && this.turn !== i) {
            denyAction(socket, "It's not your turn.");
            return;
        }
        const color = Math.floor(i / this.options.teamSize);
        const result = this.board.setCell(x, y, color);
        if (result) {
            denyAction(socket, result);
            return;
        }

        if (!this.options.skipTurn) this.turn = (this.turn + 1) % (this.options.teamSize * this.options.teamCount);

        this.emitAction(color, x, y);

        if (this.board.testWin(x, y, color)) {
            this.win(color);
            return;
        }

        if (this.board.isFull()) {
            this.end("Board full.");
            return;
        }
    }

    public open(socket: SocketRef, packet: ClientPackets["join"]) {
        if (this.started) {
            emitPacket(socket, "joinReject", "Game started.");
            return;
        }
        const i = this.sockets.length;
        if (i >= this.options.teamCount * this.options.teamSize) {
            emitPacket(socket, "joinReject", "Game full.");
            return;
        }
        try {
            const l = (x: number, y: number) => {
                this.doAction(socket, i, x, y);
            }
            this.listeners.set(socket, l);
            onPacket(socket, 'action', l);
            if (this.board.maxX === undefined || this.board.maxY === undefined) {
                emitPacket(socket, "joinAccept", i, {
                    nInARow: this.board.nInARow,
                    teamCount: this.options.teamCount,
                    teamSize: this.options.teamSize,
                    gravity: this.board.gravity,
                    skipTurn: this.options.skipTurn,
                    hex: this.options.hex,
                    infinite: true
                });
            } else {
                emitPacket(socket, "joinAccept", i, {
                    nInARow: this.board.nInARow,
                    teamCount: this.options.teamCount,
                    teamSize: this.options.teamSize,
                    gravity: this.board.gravity,
                    skipTurn: this.options.skipTurn,
                    hex: this.options.hex,
                    infinite: false,
                    width: this.board.maxX,
                    height: this.board.maxY,
                    expandLength: this.board.expandLength
                });
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

            this.emit("players", this.playerNames);

            if (this.sockets.length === this.options.teamCount * this.options.teamSize) {
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