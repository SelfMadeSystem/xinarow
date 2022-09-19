import { PlayerColor } from "../share/PlayerColor";
import { Board } from "../share/Board";
import * as CanvasManager from "./CanvasManager";
import { Vec2 } from '../share/Utils';
import { setStatusText, setTurnText } from "./main";

export abstract class BaseClientRoom {
    public playerNames: string[] = [];
    public readonly board: Board;
    public winningLines: Vec2[][] = [];
    public turn: number = 0;
    public ended: boolean = false;
    public closeCb: () => void = () => { };
    protected readonly onTap: ([x, y]: Vec2) => void;

    constructor(
        public readonly roomName: string,
        public readonly myTurn: number,
        public readonly teamCount: PlayerColor,
        public readonly teamSize: number,
        nInARow: number = 5,
        width: number | undefined = undefined,
        height: number | undefined = undefined,
    ) {
        this.board = new Board(nInARow, width, height);

        requestAnimationFrame(this.draw.bind(this));

        this.onTap = ([x, y]: Vec2) => {
            if (this.turn !== this.myTurn) {
                return;
            }
            const point = CanvasManager.fromDrawPoint(x, y);
            point[0] = Math.floor(point[0]);
            point[1] = Math.floor(point[1]);
            if (this.board.hasCell(point[0], point[1])) {
                return;
            }
            this.setCell(...point);
        }

        CanvasManager.onCanvasTap(this.onTap);
        CanvasManager.onCanvasRefresh(this.draw.bind(this));
        if (this.board.width !== undefined && this.board.height !== undefined) {
            CanvasManager.setZoomFactorForSize(this.board.width, this.board.height);
        }

        setStatusText(`Game starting...`);
    }

    actionTaken(x: number, y: number, color: PlayerColor, turn: number) {
        this.turn = turn;

        this.board.setCell(x, y, color);

        setTurnText(this.turn, this.myTurn, this.teamSize);

        this.draw();
    }

    draw() {
        if (this.ended) {
            return;
        }
        CanvasManager.ctx.clearRect(0, 0, CanvasManager.canvas.width, CanvasManager.canvas.height);

        CanvasManager.ctx.strokeStyle = 'white';

        CanvasManager.drawSetCell(this.board.lastSetCell);
        CanvasManager.drawGrid(this.board.width, this.board.height);
        CanvasManager.drawBoard(this.board);
        CanvasManager.drawWinningLines(this.winningLines);
    }

    abstract setCell(x: number, y: number): Promise<string | boolean>;
}

export default BaseClientRoom;