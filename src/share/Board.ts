import { PlayerColor } from "./PlayerColor";
import { toNaturalNumber, fromNaturalNumber, Vec2 } from "./Utils";

export class Board implements Iterable<[number, number, PlayerColor]> {
    public readonly cells: PlayerColor[][];
    public readonly winningLines: [x: number, y: number][][] = [];
    public lastSetCell?: Vec2;

    constructor(
        public readonly nInARow: number = 5,
        public readonly width: number | undefined = undefined,
        public readonly height: number | undefined = undefined,
    ) {
        this.cells = [];
    }

    private tAI(n: number) { // To Array Index
        if (this.width !== undefined) {
            return n;
        }
        return toNaturalNumber(n);
    }

    private fAI(n: number) { // From Array Index
        if (this.width !== undefined) {
            return n;
        }
        return fromNaturalNumber(n);
    }

    private _setCell(x: number, y: number, color: PlayerColor): void {
        x = this.tAI(x);
        y = this.tAI(y);

        if (!this.cells[x]) {
            this.cells[x] = [];
        }

        this.cells[x][y] = color;
    }

    public hasCell(x: number, y: number): boolean {
        x = this.tAI(x);
        y = this.tAI(y);
        return (this.cells[x] && this.cells[x][y]) !== undefined;
    }

    public setCell(x: number, y: number, color: PlayerColor): void | string {
        if (color < 0 || color > PlayerColor.Pink) {
            return `Color must be between 0 and ${PlayerColor.Pink}`;
        }
        if (this.hasCell(x, y)) {
            return "Cell already set";
        }
        if (this.width !== undefined && (x < 0 || x >= this.width)) {
            return "Cell out of bounds.";
        }
        if (this.height !== undefined && (y < 0 || y >= this.height)) {
            return "Cell out of bounds.";
        }
        this._setCell(x, y, color);
        this.lastSetCell = [x, y];
    }

    public unsetCell(x: number, y: number) {
        x = this.tAI(x);
        y = this.tAI(y);

        if (this.cells[x]) {
            this.cells[x].splice(y, 1);
        }
    }

    public getCell(x: number, y: number): PlayerColor | undefined {
        x = this.tAI(x);
        y = this.tAI(y);
        return this._getCell(x, y);
    }

    private _getCell(x: number, y: number): PlayerColor | undefined {
        return this.cells[x] && this.cells[x][y];
    }

    public isFull(): boolean {
        if (this.width === undefined || this.height === undefined) {
            return false;
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.width; y++) {
                if (!this.hasCell(x, y)) {
                    return false;
                }
            }
        }
        return true;
    }

    public testWin(x: number, y: number, color: PlayerColor): boolean {
        // We want to test all directions and not just the first one that returns true
        let result1 = this.testWinHorizontal(x, y, color);
        let result2 = this.testWinVertical(x, y, color);
        let result3 = this.testWinDiagonal(x, y, color);
        return result1 || result2 || result3;
    }

    public testWinHorizontal(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let minX: number = x;
        let maxX: number = x;
        let i = 1;
        for (let cell = this.getCell(x - i, y); cell === color; cell = this.getCell(x - ++i, y)) {
            count++;
            minX = x - i;
        }
        i = 1;
        for (let cell = this.getCell(x + i, y); cell === color; cell = this.getCell(x + ++i, y)) {
            count++;
            maxX = x + i;
        }
        if (count >= this.nInARow) {
            this.winningLines.push([[minX, y], [maxX, y]]);
            return true;
        }
        return false;
    }

    public testWinVertical(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let minY: number = y;
        let maxY: number = y;
        let i = 1;
        for (let cell = this.getCell(x, y - i); cell === color; cell = this.getCell(x, y - ++i)) {
            count++;
            minY = y - i;
        }
        i = 1;
        for (let cell = this.getCell(x, y + i); cell === color; cell = this.getCell(x, y + ++i)) {
            count++;
            maxY = y + i;
        }
        if (count >= this.nInARow) {
            this.winningLines.push([[x, minY], [x, maxY]]);
            return true;
        }
        return false;
    }

    public testWinDiagonal(x: number, y: number, color: PlayerColor): boolean {
        let result1 = this.testWinDiagonalDownhill(x, y, color);
        let result2 = this.testWinDiagonalUphill(x, y, color);
        return result1 || result2;
    }

    public testWinDiagonalDownhill(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let x1: number = x;
        let x2: number = x;
        let y1: number = y;
        let y2: number = y;
        let i = 1;
        for (let cell = this.getCell(x - i, y - i); cell === color; cell = this.getCell(x - ++i, y - i)) {
            count++;
            x1 = x - i;
            y1 = y - i;
        }
        i = 1;
        for (let cell = this.getCell(x + i, y + i); cell === color; cell = this.getCell(x + ++i, y + i)) {
            count++;
            x2 = x + i;
            y2 = y + i;
        }
        if (count >= this.nInARow) {
            this.winningLines.push([[x1, y1], [x2, y2]]);
            return true;
        }
        return false;
    }

    public testWinDiagonalUphill(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let x1: number = x;
        let x2: number = x;
        let y1: number = y;
        let y2: number = y;
        let i = 1;
        for (let cell = this.getCell(x - i, y + i); cell === color; cell = this.getCell(x - ++i, y + i)) {
            count++;
            x1 = x - i;
            y1 = y + i;
        }
        i = 1;
        for (let cell = this.getCell(x + i, y - i); cell === color; cell = this.getCell(x + ++i, y - i)) {
            count++;
            x2 = x + i;
            y2 = y - i;
        }
        if (count >= this.nInARow) {
            this.winningLines.push([[x1, y1], [x2, y2]]);
            return true;
        }
        return false;
    }

    public iterate(): Iterator<[number, number, PlayerColor]> {
        let i = 0;
        let j = 0;

        const next: () => IteratorResult<[number, number, PlayerColor]> = () => {
            const x = this.fAI(i);
            const y = this.fAI(j);
            const cell = this._getCell(i, j);
            if (cell !== undefined) {
                j++;
                return { value: [x, y, cell], done: false };
            }
            if (this.cells[i] === undefined) {
                if (++i >= this.cells.length) {
                    return { value: undefined, done: true };
                }
                j = 0;
                return next();
            }
            if (++j >= this.cells[i].length) {
                j = 0;
                if (++i >= this.cells.length) {
                    return { value: undefined, done: true };
                }
            }
            return next();
        }
        return {
            next
        }
    }


    [Symbol.iterator](): Iterator<[number, number, PlayerColor], any, undefined> {
        return this.iterate();
    }
}

export default Board;