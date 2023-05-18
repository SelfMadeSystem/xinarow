import { PlayerColor } from "../share/PlayerColor";
import { ClientPacketNames, ClientPackets, emitPacket, offPacket, onPacket, RoomOptions, ServerPacketNames, ServerPackets } from "../share/Protocol";
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
    private listeners: Map<SocketRef, [ClientPacketNames, Function][]> = new Map();
    public closeCb: () => void = () => { };
    public closed: boolean = false;

    constructor(
        public readonly roomName: string,
        public readonly options: RoomOptions
    ) {
        this.board = new Board(options);
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
        if (this.playerNames[Math.floor(this.turn / this.options.playerTurns)] !== name) {
            denyAction(socket, "It's not your turn.");
            return;
        }
        const color = Math.floor(this.turn / this.options.teamSize / this.options.playerTurns);
        const result = this.board.setCell(x, y, color);
        if (typeof result === "string") {
            denyAction(socket, result);
            return;
        }

        this.turn = (this.turn + 1) % (this.options.teamSize * this.options.teamCount * this.options.playerTurns);

        this.emitAction(color, x, y);

        if (result === true) {
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
        const [_uid, username, _room] = packet;
        const i = this.sockets.length;
        if (i >= this.options.teamCount * this.options.teamSize) {
            emitPacket(socket, "joinReject", "Game full."); // should never happen but just in case
            return;
        }
        if (username == null || username.trim() === "" || username.toLowerCase() === "shoghi") {
            emitPacket(socket, "joinReject", "Bad username.");
            return;
        }
        // if (this.playerNames.some(s => s.toLowerCase() === username.toLowerCase())) {
        if (this.playerNames.includes(username)) {
            emitPacket(socket, "joinReject", "Username taken.");
            return;
        }
        try {
            this.listeners.set(socket, []);

            const listen = <Name extends ClientPacketNames>(
                name: Name,
                listener: (...arg1: (ClientPackets)[Name]) => void) => {
                this.listeners.get(socket)!.push([name, listener]);
                onPacket(socket, name, listener);
            };

            listen("action", (x: number, y: number) => {
                this.doAction(socket, username, x, y);
            });

            listen("chat", (msg: string) => {
                if (msg.trim() === '') return;
                this.emit("playerChat", username, msg);
            });

            emitPacket(socket, "joinAccept", this.options);
            let turn = i;

            switch (this.options.teamOrder) {
                case "random":
                    turn = Math.floor(Math.random() * (i + 1));
                    break;
            }

            this.playerNames.splice(turn, 0, username);
            this.sockets.splice(turn, 0, socket);
            console.log(turn, this.options.teamOrder, this.playerNames);

            socket.on('disconnect', () => {
                socket.callIfNotReplaced(() => {
                    if (this.closed) {
                        return;
                    }
                    this.end(`Player ${username} left.`);
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
            f.forEach(([name, listener]) => {
                offPacket(s, name, listener as any);
            });
        });
        this.closeCb();
    }
}