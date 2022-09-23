import { PlayerColor } from "../share/PlayerColor";
import { Board } from "../share/Board";
import * as CanvasManager from "./CanvasManager";
import { Vec2 } from '../share/Utils';
import { setStatusText, setTurnText } from "./main";
import { RoomOptions } from "../share/Protocol";

export abstract class BaseClientRoom {
    public playerNames: string[] = [];
    public readonly board: Board;
    public winningLines: Vec2[][] = [];
    public turn: number = 0;
    public ended: boolean = false;
    public closeCb: () => void = () => { };
    private onTapBinding: (v: Vec2) => void;
    private onRefreshBinding: (v: Vec2) => void;

    constructor(
        public readonly roomName: string,
        public readonly myTurn: number,
        public readonly options: RoomOptions,
    ) {
        this.board = new Board(options.nInARow, options.gravity,
            options.infinite ? undefined : options.width,
            options.infinite ? undefined : options.height,
            options.infinite ? undefined : options.expandLength);

        requestAnimationFrame(this.draw.bind(this));

        CanvasManager.onCanvasTap(this.onTapBinding = this.onTap.bind(this));
        CanvasManager.onCanvasRefresh(this.onRefreshBinding = this.draw.bind(this));
        if (this.board.maxX !== undefined && this.board.maxY !== undefined) {
            CanvasManager.setZoomFactorForSize(this.board.maxX, this.board.maxY);
        }

        setStatusText(`Game starting...`);
    }

    onTap([x, y]: Vec2) {
        const point = CanvasManager.fromDrawPoint(x, y);
        point[0] = Math.floor(point[0]);
        point[1] = Math.floor(point[1]);
        if (!this.board.withinBounds(point[0], point[1])) {
            return;
        }
        this.setCell(...point);
    }

    actionTaken(x: number, y: number, color: PlayerColor, turn: number) {
        this.turn = turn;

        this.board.setCell(x, y, color);

        setTurnText(this.turn, this.myTurn, this.options.teamSize);

        this.draw();
    }

    draw() {
        if (this.ended) {
            return;
        }
        CanvasManager.ctx.clearRect(0, 0, CanvasManager.canvas.width, CanvasManager.canvas.height);

        CanvasManager.ctx.strokeStyle = 'white';

        CanvasManager.drawSetCell(this.board.lastSetCell);
        CanvasManager.drawGrid(this.board);
        CanvasManager.drawBoard(this.board);
        CanvasManager.drawWinningLines(this.winningLines);
    }

    end(reason?: string) {
        this.ended = true;
        CanvasManager.offCanvasTap(this.onTapBinding);
        CanvasManager.offCanvasRefresh(this.onRefreshBinding);
        if (reason) {
            alert(reason);
        }
        this.closeCb();
    }

    abstract setCell(x: number, y: number): Promise<string | boolean>;
}

export default BaseClientRoom;