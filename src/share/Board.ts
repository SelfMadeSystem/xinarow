import { PlayerColor } from "./PlayerColor";
import { GridType } from "./Protocol";
import { toNaturalNumber, fromNaturalNumber, Vec2, mod } from "./Utils";

export class Board implements Iterable<[number, number, PlayerColor]> {
    public readonly cells: PlayerColor[][];
    public readonly winningLines: [x: number, y: number][][] = [];
    public lastSetCell?: Vec2;
    public minX?: number;
    public minY?: number;


    constructor(
        public readonly nInARow: number = 5,
        public readonly gravity: boolean = false,
        public maxX?: number,
        public maxY?: number,
        public expandLength: number = 0,
        public readonly gridType: GridType = "square",
    ) {
        this.cells = [];
        if (this.maxX !== undefined && this.maxY !== undefined) {
            this.minX = 0;
            this.minY = 0;
            if (gridType === "triangle") {
                this.maxY *= 2;
            }
        } else if (gravity) {
            this.maxY = 10;
        }
    }

    private tAI(n: number) { // To Array Index
        return toNaturalNumber(n);
    }

    private fAI(n: number) { // From Array Index
        return fromNaturalNumber(n);
    }

    private getGravityY(x: number): number {
        if (this.maxY === undefined) {
            return NaN;
        }
        for (let i = this.maxY - 1; i >= (this.minY ?? -Infinity); i--) {
            if (!this.hasCell(x, i)) {
                return i;
            }
        }
        return Infinity;
    }

    public withinBounds(x: number, y: number): boolean {
        if (this.maxX !== undefined && x >= this.maxX) {
            return false;
        }
        if (this.maxY !== undefined && y >= this.maxY) {
            return false;
        }

        if (this.minX !== undefined && x < this.minX) {
            return false;
        }
        if (this.minY !== undefined && y < this.minY) {
            return false;
        }
        return true;
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
        if (!this.withinBounds(x, y)) {
            return "Cell out of bounds.";
        }
        if (this.gravity) {
            y = this.getGravityY(x);

            if (y === Infinity) {
                return "Cell out of bounds.";
            }

            if (isNaN(y)) { // For fun, pretend that it passes, but don't actually do anything.
                return;
            }
        }
        if (this.hasCell(x, y)) {
            return "Cell already set";
        }
        this._setCell(x, y, color);
        this.lastSetCell = [x, y];
        this.tryExpand(x, y);
    }

    public tryExpand(x: number, y: number) {
        if (this.expandLength > 0) {
            if (this.maxX === undefined || this.maxY === undefined ||
                this.minX === undefined || this.minY === undefined) {
                throw new Error("Board is not fully finite.");
            }
            if (x < this.minX + this.expandLength) {
                this.minX = x - this.expandLength;
            }
            if (y < this.minY + this.expandLength) {
                this.minY = y - this.expandLength * (this.gridType === "triangle" ? 2 : 1);
            }
            if (x >= this.maxX - this.expandLength) {
                this.maxX = x + this.expandLength + 1;
            }
            if (!this.gravity && y >= this.maxY - this.expandLength) {
                this.maxY = y + (this.expandLength + 1) * (this.gridType === "triangle" ? 2 : 1);
            }
        }
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
        if (this.maxX === undefined || this.maxY === undefined) {
            return false;
        }
        for (let x = 0; x < this.maxX; x++) {
            for (let y = 0; y < this.maxX; y++) {
                if (!this.hasCell(x, y)) {
                    return false;
                }
            }
        }
        return true;
    }

    public testWin(x: number, y: number, color: PlayerColor): boolean {
        if (this.gravity) {
            y = this.getGravityY(x) + 1;

            console.log("Gravity Y:", y);
            console.log(this.getCell(x, y));

            if (y === Infinity) {
                y = 0;
            }

            if (isNaN(y)) { // For fun, pretend that it passes, but don't actually do anything.
                return false;
            }
        }
        // We want to test all directions and not just the first one that returns true
        switch (this.gridType) {
            case 'square': {
                let result1 = this.testWinHorizontal(x, y, color);
                let result2 = this.testWinVertical(x, y, color);
                let result3 = this.testWinDiagonal(x, y, color);
                return result1 || result2 || result3;
            }
            case 'hex': {
                let result1 = this.testWinHorizontal(x, y, color);
                let result2 = this.testWinVertical(x, y, color);
                let result3 = this.testWinDiagonalUphill(x, y, color);
                return result1 || result2 || result3;
            }
            case 'triangle':
                let result1 = this.testWinHorizontalTriangle(x, y, color);
                let result2 = this.testWinVertical(x, y, color);
                let result3 = this.testWinVerticalTriangle(x, y, color);
                let result4 = this.testWinDiagonalUphill(x, y, color);
                let result5 = this.testWinDiagonalTriangleUpDown(x, y, color);
                let result6 = this.testWinDiagonalTriangleDownhill(x, y, color);
                return result1 || result2 || result3 || result4 || result5 || result6;
            default:
                throw new Error("Unknown grid type.");
        }
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

    public testWinHorizontalTriangle(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let startX = x;
        let endX = x;
        let startY = y;
        let endY = y;
        let i = 1;
        if (mod(y, 2) === 0) {
            for (let cell = this.getCell(x - Math.floor((i + 1) / 2), y + i % 2); cell === color;
                cell = this.getCell(x - Math.floor((++i + 1) / 2), y + i % 2)) {
                count++;
                startX = x - Math.floor((i + 1) / 2);
                startY = y + i % 2;
            }
            i = 1;
            for (let cell = this.getCell(x + Math.floor(i / 2), y + i % 2); cell === color;
                cell = this.getCell(x + Math.floor(++i / 2), y + i % 2)) {
                count++;
                endX = x + Math.floor(i / 2);
                endY = y + i % 2;
            }
        } else {
            for (let cell = this.getCell(x - Math.floor(i / 2), y - i % 2); cell === color;
                cell = this.getCell(x - Math.floor(++i / 2), y - i % 2)) {
                count++;
                startX = x - Math.floor(i / 2);
                startY = y - i % 2;
            }
            i = 1;
            for (let cell = this.getCell(x + Math.floor((i + 1) / 2), y - i % 2); cell === color;
                cell = this.getCell(x + Math.floor((++i + 1) / 2), y - i % 2)) {
                count++;
                endX = x + Math.floor((i + 1) / 2);
                endY = y - i % 2;
            }
        }
        if (count >= this.nInARow) {
            this.winningLines.push([[startX, startY], [endX, endY]]);
            return true;
        }
        return false;
    }

    public testWinVerticalTriangle(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let min: Vec2 = [x, y];
        let max: Vec2 = [x, y];
        let i = 1;

        const getPos = (i: number): Vec2 => {
            if (mod(y, 2) === 0) {
                return [x + Math.floor(i / 2), y - i];
            } else {
                return [x + Math.floor((i + 1) / 2), y - i];
            }
        };

        for (let cell = this.getCell(...getPos(-i)); cell === color; cell = this.getCell(...getPos(-++i))) {
            count++;
            min = getPos(-i);
        }
        i = 1;
        for (let cell = this.getCell(...getPos(i)); cell === color; cell = this.getCell(...getPos(++i))) {
            count++;
            max = getPos(i);
        }
        if (count >= this.nInARow) {
            this.winningLines.push([min, max]);
            return true;
        }
        return false;
    }

    public testWinDiagonalTriangleUpDown(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let min: Vec2 = [x, y];
        let max: Vec2 = [x, y];
        let i = 1;

        const getPos = (i: number): Vec2 => {
            if (mod(y, 2) === 0) {
                return [x + Math.floor(i / 2), y - i - Math.floor(i / 2) * 2];
            } else {
                return [x + Math.floor((i + 1) / 2), y - i - Math.floor((i + 1) / 2) * 2];
            }
        };

        for (let cell = this.getCell(...getPos(-i)); cell === color; cell = this.getCell(...getPos(-++i))) {
            count++;
            min = getPos(-i);
        }
        i = 1;
        for (let cell = this.getCell(...getPos(i)); cell === color; cell = this.getCell(...getPos(++i))) {
            count++;
            max = getPos(i);
        }
        if (count >= this.nInARow) {
            this.winningLines.push([min, max]);
            return true;
        }
        return false;
    }

    public testWinDiagonalTriangleDownhill(x: number, y: number, color: PlayerColor): boolean {
        let count = 1;
        let min: Vec2 = [x, y];
        let max: Vec2 = [x, y];
        let i = 1;

        const getPos = (i: number): Vec2 => {
            if (mod(y, 2) === 0) {
                return [x + Math.floor(i / 2), y + i];
            } else {
                return [x + Math.floor((i + 1) / 2), y + i];
            }
        };

        for (let cell = this.getCell(...getPos(-i)); cell === color; cell = this.getCell(...getPos(-++i))) {
            count++;
            min = getPos(-i);
        }
        i = 1;
        for (let cell = this.getCell(...getPos(i)); cell === color; cell = this.getCell(...getPos(++i))) {
            count++;
            max = getPos(i);
        }
        if (count >= this.nInARow) {
            this.winningLines.push([min, max]);
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
        };
        return {
            next
        };
    }


    [Symbol.iterator](): Iterator<[number, number, PlayerColor], any, undefined> {
        return this.iterate();
    }
}

export default Board;