import { PlayerColor } from "../share/PlayerColor";
import BaseClientRoom from "./BaseClientRoom";
import { setTurnText } from "./main";

export class OfflineClientRoom extends BaseClientRoom {

    constructor(
        roomName: string,
        myTurn: number,
        teamCount: PlayerColor,
        teamSize: number,
        nInARow: number,
        gravity: boolean,
        width: number | undefined,
        height: number | undefined,
    ) {
        super(roomName, myTurn, teamCount, teamSize, nInARow, gravity, width, height);

        setTurnText(this.turn, -1, this.teamSize);
    }
    async setCell(x: number, y: number): Promise<string | boolean> {
        const color = Math.floor(this.turn / this.teamSize);
        const result = this.board.setCell(x, y, color);
        if (typeof result === "string") {
            return result;
        }
        this.turn = (this.turn + 1) % (this.teamSize * this.teamCount);
        if (this.board.testWin(x, y, color)) {
            this.win();
        } else if (this.board.isFull()) {
            this.end("Board is full");
        } else {
            this.draw();
            setTurnText(this.turn, -1, this.teamSize);
        }

        return true;
    }

    win() {
        this.winningLines = this.board.winningLines;
        this.draw();
        this.end();
    }
}