import { PlayerColor } from "../share/PlayerColor";
import { onPacket, offPacket, RoomOptions } from "../share/Protocol";
import { action } from "./GameHandler";
import { socket } from "./socket";
import { Vec2 } from "../share/Utils";
import { addChatMessage, addPlayerJoinMessage, setTurnText } from "./main";
import BaseClientRoom from "./BaseClientRoom";

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

        onPacket(socket, "players", (fPlayers = (u) => {
            const newPlayers = u.filter((p) => !this.playerNames.includes(p));
            newPlayers.forEach(p => addPlayerJoinMessage(p, u.length, this.options.teamCount * this.options.teamSize));
            this.playerNames = u;
        }));

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
    }

    override setCell(x: number, y: number) {
        if (Math.floor(this.turn / this.options.playerTurns) !== this.myTurn) {
            return Promise.resolve("It's not your turn!");
        }
        return action(x, y);
    }
}
