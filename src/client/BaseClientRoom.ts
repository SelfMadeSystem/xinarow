import { PlayerColor } from "../share/PlayerColor";
import { Board } from "../share/Board";
import * as CanvasManager from "./CanvasManager";
import { Vec2 } from '../share/Utils';
import { setStatusText, setTimeText, setTurnText } from "./main";
import { RoomOptions } from "../share/Protocol";

const DBL_INV_SQRT_3 = 2 / Math.sqrt(3);

export abstract class BaseClientRoom {
    public playerNames: string[] = [];
    public readonly board: Board;
    public winningLines: Vec2[][] = [];
    public turn: number = 0;
    public ended: boolean = false;
    public closeCb: () => void = () => { };
    private onTapBinding: (v: Vec2) => void;
    private onRefreshBinding: (v: Vec2) => void;
    public startTime: number = Date.now();

    constructor(
        public readonly roomName: string,
        public readonly myTurn: number,
        public readonly options: RoomOptions,
    ) {
        this.board = new Board(options.nInARow, options.gravity,
            options.infinite ? undefined : options.width,
            options.infinite ? undefined : options.height,
            options.infinite ? undefined : options.expandLength,
            options.gridType);

        requestAnimationFrame(this.draw.bind(this));

        CanvasManager.onCanvasTap(this.onTapBinding = this.onTap.bind(this));
        CanvasManager.onCanvasRefresh(this.onRefreshBinding = this.draw.bind(this));
        if (this.board.maxX !== undefined && this.board.maxY !== undefined) {
            CanvasManager.setZoomFactor(this.board);
        }

        setStatusText(`Game starting...`);

        requestAnimationFrame(this.setTimeText.bind(this));
    }

    setTimeText() {
        const time = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        setTimeText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        if (!this.ended) {
            requestAnimationFrame(this.setTimeText.bind(this));
        }
    }

    onTap([x, y]: Vec2) {
        let point = CanvasManager.fromDrawPoint(x, y);

        switch (this.options.gridType) {
            case 'square':
                point[0] = Math.floor(point[0]);
                point[1] = Math.floor(point[1]);
                break;
            case 'hex':
                point[1] *= DBL_INV_SQRT_3;
                point[1] = Math.floor(point[1]);
                point[0] -= point[1] / 2;
                point[0] = Math.floor(point[0]);
                break;
            case 'triangle':
                point[0] = Math.floor(point[0]);
                point[1] = Math.floor(point[1]);
                break;
        }
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

        CanvasManager.drawSetCell(this.board);
        CanvasManager.drawGrid(this.board);
        CanvasManager.drawBoard(this.board);
        CanvasManager.drawWinningLines(this.board, this.winningLines);
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