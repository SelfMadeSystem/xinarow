import { RoomOptions } from "../share/Protocol";
import BaseClientRoom from "./BaseClientRoom";
import { setTurnText } from "./main";

export class OfflineClientRoom extends BaseClientRoom {

    constructor(
        roomName: string,
        options: RoomOptions,
    ) {
        super(roomName, options);

        setTurnText(this.turn, -1, this.options.teamSize);
    }
    async setCell(x: number, y: number): Promise<string | boolean> {
        const color = Math.floor(this.turn / this.options.teamSize);
        const result = this.board.setCell(x, y, color);
        if (typeof result === "string") {
            return result;
        }
        this.turn = (this.turn + 1) % (this.options.teamSize * this.options.teamCount);
        if (result === true) {
            this.win();
        } else if (this.board.isFull()) {
            this.end("Board is full");
        } else {
            this.draw();
            setTurnText(this.turn, -1, this.options.teamSize);
        }

        return true;
    }

    win() {
        this.winningLines = this.board.winningLines;
        this.draw();
        this.end();
    }
}