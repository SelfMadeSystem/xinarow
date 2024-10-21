import { PlayerColor } from "../share/PlayerColor";
import { onPacket, offPacket, RoomOptions } from "../share/Protocol";
import { action, setCommandHandler } from "./GameHandler";
import { socket } from "./socket";
import { Vec2 } from "../share/Utils";
import { addChatMessage, addPlayerJoinMessage, setTurnText } from "./main";
import BaseClientRoom from "./BaseClientRoom";

const metalPipeUrl = "/metal-pipe.mp3";

export class OnlineClientRoom extends BaseClientRoom {
    constructor(roomName: string, options: RoomOptions) {
        super(roomName, options);

        let fActionTaken: (
            x: number,
            y: number,
            p: PlayerColor,
            playerTurn: number
        ) => void;
        let fPlayers: (users: string[]) => void;
        let fGameWon: (p: PlayerColor, l: Vec2[][]) => void;
        let fGameEnd: (s: string) => void;
        let fGameStarted: (i: number) => void;
        let fChat: (message: string, username: string) => void;

        onPacket(
            socket,
            "actionTaken",
            (fActionTaken = this.actionTaken.bind(this))
        );

        onPacket(
            socket,
            "players",
            (fPlayers = (u) => {
                const newPlayers = u.filter(
                    (p) => !this.playerNames.includes(p)
                );
                newPlayers.forEach((p) =>
                    addPlayerJoinMessage(
                        p,
                        u.length,
                        this.options.teamCount * this.options.teamSize
                    )
                );
                this.playerNames = u;
            })
        );

        onPacket(
            socket,
            "gameWon",
            (fGameWon = (winner, lines) => {
                console.log("Won!", winner, lines);
                this.winningLines = lines;
                this.draw();
                this.end();
            })
        );

        onPacket(
            socket,
            "gameEnd",
            (fGameEnd = (reason) => {
                console.log("Ended...", reason);
                this.end(reason);
            })
        );

        onPacket(
            socket,
            "gameStarted",
            (fGameStarted = (i) => {
                console.log("Started!");
                this.myTurn = i;
                this.turn = 0;
                setTurnText(
                    this.turn,
                    this.myTurn,
                    this.options,
                    this.playerNames
                );
                this.startTime = Date.now();
            })
        );

        onPacket(
            socket,
            "playerChat",
            (fChat = (username: string, message: string) => {
                if (message.startsWith("/")) {
                    if (this.handleOthersCommand(username, message)) {
                        return;
                    }
                }
                addChatMessage(message, username);
            })
        );

        this.end = (reason?: string) => {
            super.end(reason);

            offPacket(socket, "actionTaken", fActionTaken);

            offPacket(socket, "players", fPlayers);

            offPacket(socket, "gameWon", fGameWon);

            offPacket(socket, "gameEnd", fGameEnd);

            offPacket(socket, "gameStarted", fGameStarted);

            offPacket(socket, "playerChat", fChat);
        };

        setCommandHandler(this.handleCommand.bind(this));
    }

    handleOthersCommand(username: string, message: string): boolean {
        const [command, ..._args] = message.slice(1).split(" ");
        switch (command) {
            case "metalpipe": {
                if (this.turn === this.myTurn) {
                    if (username === this.playerNames[this.myTurn]) {
                        addChatMessage(
                            "You can't use /metalpipe on your turn!",
                            "/metalpipe"
                        );
                        return true;
                    }
                    const metalPipe = new Audio(metalPipeUrl);
                    metalPipe.play();
                    addChatMessage(
                        `${username} played a metal pipe sound!`,
                        ""
                    );
                }
                return true;
            }
        }
        return false;
    }

    handleCommand(message: string): boolean {
        const [command, ..._args] = message.slice(1).split(" ");
        switch (command) {
            case "turn": {
                addChatMessage(
                    `It's turn ${this.turn}. Turn order is: red, green, blue, yellow, magenta, cyan, orange, pink.`,
                    "/turn"
                );
                return true;
            }
            case "options": {
                addChatMessage(
                    `Options: ${JSON.stringify(this.options, null, 2)}`,
                    "/options"
                );
                return true;
            }
        }
        return false;
    }

    override setCell(x: number, y: number) {
        if (Math.floor(this.turn / this.options.playerTurns) !== this.myTurn) {
            return Promise.resolve("It's not your turn!");
        }
        return action(x, y);
    }
}
