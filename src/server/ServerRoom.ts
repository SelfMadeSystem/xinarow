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
            options.gridType);
        console.log("Game created: " + roomName);
    }

    private emit<Name extends ServerPacketNames>(name: Name,
        ...packet: (ClientPackets & ServerPackets)[Name]) {
        this.sockets.forEach(s => emitPacket(s, name, ...packet));
    }

    private emitAction(color: number, x: number, y: number) {
        this.emit("actionTaken", x, y, color, this.turn);
    }

    private doAction(socket: SocketRef, name: string, x: number, y: number) {
        if (!this.started) {
            denyAction(socket, "The game has not started.");
            return;
        }
        if (!this.options.skipTurn && this.playerNames[this.turn] !== name) {
            denyAction(socket, "It's not your turn.");
            return;
        }
        const color = Math.floor(this.turn / this.options.teamSize);
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
            emitPacket(socket, "joinReject", "Game full."); // should never happen but just in case
            return;
        }
        if (packet[1] == null || packet[1].trim() === "") {
            emitPacket(socket, "joinReject", "Bad username.");
            return;
        }
        // if (this.playerNames.some(s => s.toLowerCase() === packet[1].toLowerCase())) {
        if (this.playerNames.includes(packet[1])) {
            emitPacket(socket, "joinReject", "Username taken.");
            return;
        }
        try {
            const l = (x: number, y: number) => {
                this.doAction(socket, packet[1], x, y);
            }

            this.listeners.set(socket, l);
            onPacket(socket, 'action', l);
            emitPacket(socket, "joinAccept", {
                nInARow: this.board.nInARow,
                teamCount: this.options.teamCount,
                teamSize: this.options.teamSize,
                gravity: this.board.gravity,
                skipTurn: this.options.skipTurn,
                gridType: this.options.gridType,
                teamOrder: this.options.teamOrder,
                ...((this.board.maxX === undefined || this.board.maxY === undefined) ?
                    { infinite: true } :
                    {
                        infinite: false,
                        width: this.board.maxX,
                        height: this.board.maxY,
                        expandLength: this.board.expandLength
                    })
            });
            let turn = i;

            switch (this.options.teamOrder) {
                case "random": 
                    turn = Math.floor(Math.random() * (i + 1));
                    break;
            }

            this.playerNames.splice(turn, 0, packet[1]);
            this.sockets.splice(turn, 0, socket);
            console.log(turn, this.options.teamOrder, this.playerNames);

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
        for (let i = 0; i < this.sockets.length; i++) {
            emitPacket(this.sockets[i], 'gameStarted', i);
        }
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