import { PlayerColor } from "../share/PlayerColor";
import { onPacket, offPacket } from "../share/Protocol";
import { action } from "./GameHandler";
import * as CanvasManager from "./CanvasManager";
import { socket } from './socket';
import { Vec2 } from '../share/Utils';
import { setTurnText } from "./main";
import BaseClientRoom from "./BaseClientRoom";

export class OnlineClientRoom extends BaseClientRoom {
    constructor(
        roomName: string,
        myTurn: number,
        teamCount: PlayerColor,
        teamSize: number,
        nInARow: number = 5,
        width: number | undefined = undefined,
        height: number | undefined = undefined,
    ) {
        super(roomName, myTurn, teamCount, teamSize, nInARow, width, height);

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
            end();
        })

        onPacket(socket, 'gameEnd', fGameEnd = (reason) => {
            console.log("Ended...", reason);
            end();
            alert(reason);
        })

        onPacket(socket, 'gameStarted', fGameStarted = () => {
            console.log("Started!");
            setTurnText(this.turn, this.myTurn, this.teamSize);
        })

        const end = () => {
            this.draw();
            this.ended = true;
            this.closeCb();
            CanvasManager.offCanvasTap(this.onTap);

            offPacket(socket, 'actionTaken', fActionTaken);

            offPacket(socket, 'players', fPlayers);

            offPacket(socket, 'gameWon', fGameWon);

            offPacket(socket, 'gameEnd', fGameEnd);

            offPacket(socket, 'gameStarted', fGameStarted);
        }
    }

    override setCell(x: number, y: number) {
        return action(x, y);
    }
}