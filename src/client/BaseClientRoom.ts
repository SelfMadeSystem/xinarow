import { PlayerColor } from "../share/PlayerColor";
import { Board } from "../share/Board";
import * as CanvasManager from "./CanvasManager";
import { mod, Vec2 } from "../share/Utils";
import { setStatusText, setTimeText, setTurnText } from "./main";
import { RoomOptions } from "../share/Protocol";

const DBL_INV_SQRT_3 = 2 / Math.sqrt(3);

export abstract class BaseClientRoom {
    public playerNames: string[] = [];
    public readonly board: Board;
    public winningLines: Vec2[][] = [];
    public turn: number = 0;
    public myTurn: number = -1;
    public ended: boolean = false;
    public closeCb: () => void = () => {};
    public placedThingCb: () => void = () => {};
    public serverPlacedThingCb: (result: string | boolean) => void = () => {};
    private onTapBinding: (v: Vec2) => void;
    private onRefreshBinding: (v: Vec2) => void;
    public startTime: number = Date.now();

    constructor(
        public readonly roomName: string,
        public readonly options: RoomOptions
    ) {
        this.board = new Board(options);

        requestAnimationFrame(this.draw.bind(this));

        CanvasManager.onCanvasTap((this.onTapBinding = this.onTap.bind(this)));
        CanvasManager.onCanvasRefresh(
            (this.onRefreshBinding = this.draw.bind(this))
        );
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
        setTimeText(`Time: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
        if (!this.ended) {
            requestAnimationFrame(this.setTimeText.bind(this));
        }
    }

    onTap([x, y]: Vec2) {
        let point = CanvasManager.fromDrawPoint(x, y);

        switch (this.options.gridType) {
            case "square":
                point[0] = Math.floor(point[0]);
                point[1] = Math.floor(point[1]);
                break;
            case "hex":
                point[1] *= DBL_INV_SQRT_3;
                point[1] = Math.floor(point[1]);
                point[0] -= point[1] / 2;
                point[0] = Math.floor(point[0]);
                break; // innacurate but good enough
            case "triangle":
                point[1] *= DBL_INV_SQRT_3;
                point[0] -= point[1] / 2;
                const og = [point[0], point[1]];
                point[0] = Math.floor(point[0]);
                point[1] = Math.floor(point[1]);
                point[1] *= 2;

                if (mod(og[0], 1) + mod(og[1], 1) > 1) {
                    point[1] += 1;
                }
                break;
        }
        if (!this.board.withinBounds(point[0], point[1])) {
            return;
        }
        this.placedThingCb();

        this.setCell(...point).then(this.serverPlacedThingCb);
    }

    actionTaken(x: number, y: number, color: PlayerColor, turn: number) {
        this.turn = turn;

        this.board.setCell(x, y, color);

        setTurnText(this.turn, this.myTurn, this.options, this.playerNames);

        this.draw();
    }

    draw() {
        CanvasManager.ctx.clearRect(
            0,
            0,
            CanvasManager.canvas.width,
            CanvasManager.canvas.height
        );

        CanvasManager.ctx.strokeStyle = "white";

        CanvasManager.drawSetCell(this.board);
        CanvasManager.drawGrid(this.board);
        CanvasManager.drawBoard(this.board);
        CanvasManager.drawWinningLines(this.board, this.winningLines);
    }

    end(reason?: string) {
        this.ended = true;
        CanvasManager.offCanvasTap(this.onTapBinding);
        CanvasManager.offCanvasRefresh(this.onRefreshBinding);
        this.draw();
        if (reason) {
            alert(reason);
        }
        this.closeCb();
    }

    abstract setCell(x: number, y: number): Promise<string | boolean>;
}

export default BaseClientRoom;
