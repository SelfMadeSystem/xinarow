import { PlayerColor } from "../share/PlayerColor";
import { onPacket, offPacket, RoomOptions } from "../share/Protocol";
import { action } from "./GameHandler";
import { socket } from './socket';
import { Vec2 } from '../share/Utils';
import { setTurnText } from "./main";
import BaseClientRoom from "./BaseClientRoom";

export class OnlineClientRoom extends BaseClientRoom {
    constructor(
        roomName: string,
        myTurn: number,
        options: RoomOptions,
    ) {
        super(roomName, myTurn, options);

        let fActionTaken: (x: number, y: number, p: PlayerColor, playerTurn: number) => void;
        let fPlayers: (users: string[]) => void;
        let fGameWon: (p: PlayerColor, l: Vec2[][]) => void;
        let fGameEnd: (s: string) => void;
        let fGameStarted: () => void;

        onPacket(socket, 'actionTaken', fActionTaken = this.actionTaken.bind(this));

        onPacket(socket, 'players', fPlayers = (u) => this.playerNames = u);

        onPacket(socket, 'gameWon', fGameWon = (winner, lines) => {
            console.log('Won!', winner, lines);
            this.winningLines = lines;
            this.draw();
            this.end();
        })

        onPacket(socket, 'gameEnd', fGameEnd = (reason) => {
            console.log("Ended...", reason);
            this.end(reason);
        })

        onPacket(socket, 'gameStarted', fGameStarted = () => {
            console.log("Started!");
            setTurnText(this.turn, this.myTurn, this.options.teamSize);
            this.startTime = Date.now();
        })

        this.end = (reason?: string) => {
            super.end(reason);

            offPacket(socket, 'actionTaken', fActionTaken);

            offPacket(socket, 'players', fPlayers);

            offPacket(socket, 'gameWon', fGameWon);

            offPacket(socket, 'gameEnd', fGameEnd);

            offPacket(socket, 'gameStarted', fGameStarted);
        }
    }

    override setCell(x: number, y: number) {
        if (!this.options.skipTurn && this.turn !== this.myTurn) {
            return new Promise<string>((r) => r("It's not your turn!"));
        }
        return action(x, y);
    }
}