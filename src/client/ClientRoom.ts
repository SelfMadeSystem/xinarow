import { PlayerColor } from "../share/PlayerColor";
import { onPacket, offPacket } from "../share/Protocol";
import { Board } from "../share/Board";
import { action } from "./GameHandler";
import * as CanvasManager from "./CanvasManager";
import { socket } from './socket';
import { Vec2 } from '../share/Utils';
import { setStatusText, setTurnText } from "./main";

export class ClientRoom {
    public playerNames: string[] = [];
    public readonly board: Board;
    public winningLines: Vec2[][] = [];
    public turn: number = 0;
    public ended: boolean = false;
    public closeCb: () => void = () => { };

    constructor(
        public readonly roomName: string,
        public readonly color: PlayerColor,
        nInARow: number = 5,
        width: number | undefined = undefined,
        height: number | undefined = undefined,
    ) {
        this.board = new Board(nInARow, width, height);

        let fActionTaken: (x: number, y: number, p: PlayerColor) => void;
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
            setTurnText(this.turn, this.color);
        })

        requestAnimationFrame(this.draw.bind(this));

        const onTap = ([x, y]: Vec2) => {
            const point = CanvasManager.fromDrawPoint(x, y);
            point[0] = Math.floor(point[0]);
            point[1] = Math.floor(point[1]);
            this.setCell(...point);
        }

        const end = () => {
            this.draw();
            this.ended = true;
            this.closeCb();
            CanvasManager.offCanvasTap(onTap);

            offPacket(socket, 'actionTaken', fActionTaken);

            offPacket(socket, 'players', fPlayers);

            offPacket(socket, 'gameWon', fGameWon);

            offPacket(socket, 'gameEnd', fGameEnd);

            offPacket(socket, 'gameStarted', fGameStarted);
        }

        CanvasManager.onCanvasTap(onTap);
        CanvasManager.onCanvasRefresh(this.draw.bind(this));

        setStatusText(`Game starting...`);
    }

    actionTaken(x: number, y: number, color: PlayerColor) {
        this.turn = (color + 1) % this.playerNames.length;

        this.board.setCell(x, y, color);

        setTurnText(this.turn, this.color);

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

    setCell(x: number, y: number) {
        return action(x, y);
    }
}