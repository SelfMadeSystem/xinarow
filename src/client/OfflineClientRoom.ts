import { RoomOptions } from "../share/Protocol";
import BaseClientRoom from "./BaseClientRoom";
import { setTurnText } from "./main";

export class OfflineClientRoom extends BaseClientRoom {
    constructor(roomName: string, options: RoomOptions) {
        super(roomName, options);

        this.turn = 0;
        setTurnText(this.turn, -1, this.options);
    }
    async setCell(x: number, y: number): Promise<string | boolean> {
        const color = Math.floor(
            this.turn / this.options.teamSize / this.options.playerTurns
        );
        const result = this.board.setCell(x, y, color);
        if (typeof result === "string") {
            return result;
        }
        this.turn =
            (this.turn + 1) %
            (this.options.teamSize *
                this.options.teamCount *
                this.options.playerTurns);
        if (result === true) {
            this.win();
        } else if (this.board.isFull()) {
            this.end("Board is full");
        } else {
            this.draw();
            setTurnText(this.turn, -1, this.options);
        }

        return true;
    }

    win() {
        this.winningLines = this.board.winningLines;
        this.draw();
        this.end();
    }
}
