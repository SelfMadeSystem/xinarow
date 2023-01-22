import { getHexForColor } from "../share/PlayerColor";
import { Vec2, clamp, cartesianToHex, hexToCartesian, mod } from "../share/Utils";
import Board from "../share/Board";

export const canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

export let width: number = canvas.width;

export let height: number = canvas.height;

new ResizeObserver(() => {
    width = canvas.width = canvas.clientWidth;
    height = canvas.height = canvas.clientHeight;
    refresh();
}).observe(canvas);

const tapMaxTime = 150;

const tapMaxDistance = 10;

const tapObservers: ((pos: Vec2) => void)[] = [];

export function onCanvasTap(cb: (pos: Vec2) => void) {
    tapObservers.push(cb);
}

export function offCanvasTap(cb: (pos: Vec2) => void) {
    const index = tapObservers.indexOf(cb);
    if (index !== -1) {
        tapObservers.splice(index, 1);
    }
}

const refreshObservers: ((pos: Vec2) => void)[] = [];

export function onCanvasRefresh(cb: (pos: Vec2) => void) {
    refreshObservers.push(cb);
}

export function offCanvasRefresh(cb: (pos: Vec2) => void) {
    const index = refreshObservers.indexOf(cb);
    if (index !== -1) {
        refreshObservers.splice(index, 1);
    }
}

export function refresh() {
    for (const cb of refreshObservers) {
        cb(pos);
    }
}

// Position and zoom

let pos: Vec2 = [0, 0];
let zoom = 50;

const minZoom = zoom * (2 ** -2);
const maxZoom = zoom * (2 ** 2);

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();

    let zoomAmount = 1.002;

    const delta = event.deltaY;

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const diffX = pos[0] - mouseX;
    const diffY = pos[1] - mouseY;

    const oldZoom = zoom;
    const newZoom = clamp(oldZoom * (zoomAmount ** -delta), minZoom, maxZoom);

    const newX = mouseX + diffX * (newZoom / oldZoom);
    const newY = mouseY + diffY * (newZoom / oldZoom);

    const newPos: Vec2 = [newX, newY];

    zoom = newZoom;
    pos = newPos;

    refresh();
});

canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const time = Date.now();

    let tap = true;

    const mousePos: Vec2 = [event.clientX, event.clientY];
    const oldPos = pos;

    const move = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const newPos: Vec2 = [event.clientX, event.clientY];
        const diff: Vec2 = [newPos[0] - mousePos[0], newPos[1] - mousePos[1]];

        if (!tap) {
        } else if ((Date.now() - time > tapMaxTime ||
            Math.abs(diff[0]) > tapMaxDistance ||
            Math.abs(diff[1]) > tapMaxDistance)) {
            tap = false;
        } else {
            return;
        }

        pos = [oldPos[0] + diff[0], oldPos[1] + diff[1]];
        refresh();
    };

    const up = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        canvas.removeEventListener('mousemove', move);
        canvas.removeEventListener('mouseup', up);


        if (tap) {
            tapObservers.forEach(cb => cb(mousePos));
        }
    };

    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', up);
});

function getCenter(touches: TouchList): Vec2 {
    let x = 0;
    let y = 0;

    // Since the object "TouchList" is not iterable, we have to use
    // a good old fashioned c-style for loop
    for (let i = 0; i < touches.length; i++) {
        x += touches[i].clientX;
        y += touches[i].clientY;
    }

    return [x / touches.length, y / touches.length];
}

function getAverageDistanceFromCenter(touches: TouchList, center: Vec2): number {
    let dist = 0;

    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - center[0];
        const y = touch.clientY - center[1];

        dist += x * x + y * y;
    }

    dist /= touches.length;

    return Math.sqrt(dist);
}

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.touches.length > 1) {
        return; // Already zooming
    }

    const time = Date.now();

    let tap = true;

    const touchPos: Vec2 = [event.touches[0].clientX, event.touches[0].clientY];
    const oldPos = pos;
    const mapPos = fromDrawPoint(touchPos[0], touchPos[1]);

    const start = (event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        [touchPos[0], touchPos[1]] = getCenter(event.touches);
        [oldPos[0], oldPos[1]] = pos;
        [mapPos[0], mapPos[1]] = fromDrawPoint(touchPos[0], touchPos[1]);

        tap = false;
    };

    let prevDist: number | null = null;

    const move = (event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!tap) {
        } else if (Date.now() > time + tapMaxTime) {
            tap = false;
        } else if (event.touches.length > 1) {
            tap = false;
        } else {
            const [x, y] = getCenter(event.touches);
            const diffX = x - touchPos[0];
            const diffY = y - touchPos[1];

            if (Math.abs(diffX) > tapMaxDistance ||
                Math.abs(diffY) > tapMaxDistance) {
                tap = false;
            } else {
                return;
            }
        }

        if (event.touches.length > 1) {
            const touches = event.touches;

            const center: Vec2 = getCenter(touches);

            const dist = getAverageDistanceFromCenter(touches, center);

            if (prevDist === null) {
                prevDist = dist;
                return;
            }

            const multiplicativeDelta = dist / prevDist;

            const oldZoom = zoom;
            const newZoom = clamp(oldZoom * multiplicativeDelta, minZoom, maxZoom);
            const newX = center[0] - mapPos[0] * newZoom;
            const newY = center[1] - mapPos[1] * newZoom;

            const newPos: Vec2 = [newX, newY];

            zoom = newZoom;
            pos = newPos;

            prevDist = dist;
            refresh();
            return;
        } else {
            prevDist = null;

            const touch: Vec2 = [event.touches[0].clientX, event.touches[0].clientY];
            const diff: Vec2 = [touch[0] - touchPos[0], touch[1] - touchPos[1]];

            pos = [oldPos[0] + diff[0], oldPos[1] + diff[1]];
            refresh();
        }
    };

    const up = (event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.touches.length === 0) {
            canvas.removeEventListener('touchstart', start);
            canvas.removeEventListener('touchmove', move);
            canvas.removeEventListener('touchend', up);

            if (tap) {
                tapObservers.forEach(cb => cb(touchPos));
            }
        } else {
            [touchPos[0], touchPos[1]] = getCenter(event.touches);
            [oldPos[0], oldPos[1]] = pos;
            [mapPos[0], mapPos[1]] = fromDrawPoint(touchPos[0], touchPos[1]);
        }
    };

    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    canvas.addEventListener('touchend', up);
});

// Drawing I guess

export function toDrawPoint(x: number, y: number): Vec2 {
    return [x * zoom + pos[0], y * zoom + pos[1]];
}

export function fromDrawPoint(x: number, y: number): Vec2 {
    return [(x - pos[0]) / zoom, (y - pos[1]) / zoom];
}

export function drawCell(x: number, y: number, color: string, size: number = 1) {
    const [x1, y1] = toDrawPoint(x, y);
    const [x2, y2] = toDrawPoint(x + size, y + size);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc((x1 + x2) / 2, (y1 + y2) / 2, (x2 - x1) / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function drawLine(x1: number, y1: number, x2: number, y2: number) {
    [x1, y1] = toDrawPoint(x1, y1);
    [x2, y2] = toDrawPoint(x2, y2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function fillRect(x1: number, y1: number, x2: number, y2: number) {
    [x1, y1] = toDrawPoint(x1, y1);
    [x2, y2] = toDrawPoint(x2, y2);
    ctx.beginPath();
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.stroke();
}

function fillShape(points: Vec2[]) {
    ctx.beginPath();
    ctx.moveTo(...toDrawPoint(...points[0]));
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(...toDrawPoint(...points[i]));
    }
    ctx.fill();
}

export function drawSetCell(board: Board) {
    let cell = board.lastSetCell;
    if (cell === undefined) {
        return;
    }
    ctx.fillStyle = '#fff9';
    switch (board.gridType) {
        case 'square':
            fillRect(...cell, cell[0] + 1, cell[1] + 1);
            break;
        case 'hex':
            cell = cartesianToHex(...cell);

            let [x, y] = cell;

            x += 0.5;
            y += 0.5;

            let p1: Vec2 = [x, y - ISQRT_3];
            let p2: Vec2 = [x + 0.5, y - HALF_ISQRT_3];
            let p3: Vec2 = [x + 0.5, y + HALF_ISQRT_3];
            let p4: Vec2 = [x, y + ISQRT_3];
            let p5: Vec2 = [x - 0.5, y + HALF_ISQRT_3];
            let p6: Vec2 = [x - 0.5, y - HALF_ISQRT_3];

            fillShape([p1, p2, p3, p4, p5, p6]);
            break;
        case 'triangle':
            fillRect(...cell, cell[0] + 1, cell[1] + 1);
            break;
    }
}

function _drawSquareGrid(startX: number, startY: number, endX: number, endY: number) {
    for (let x = startX; x <= endX; x++) {
        drawLine(x, startY, x, endY);
    }
    for (let y = startY; y <= endY; y++) {
        drawLine(startX, y, endX, y);
    }
}

const ISQRT_3 = 1 / Math.sqrt(3);
const HALF_ISQRT_3 = ISQRT_3 / 2;
const HALF_SQRT_3 = Math.sqrt(3) / 2;

function _drawHexGrid(startX: number, startY: number, endX: number, endY: number) {
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            let [cx, cy] = cartesianToHex(x, y);
            cy += 0.5;
            cx += 0.5;

            let [x1, y1] = [cx, cy - ISQRT_3];
            let [x2, y2] = [cx + 0.5, cy - HALF_ISQRT_3];
            let [x3, y3] = [cx + 0.5, cy + HALF_ISQRT_3];
            let [x4, y4] = [cx, cy + ISQRT_3];

            drawLine(x1, y1, x2, y2);
            drawLine(x2, y2, x3, y3);
            drawLine(x3, y3, x4, y4);

            if (x === startX) {
                drawLine(x2 - 1, y2, x3 - 1, y3);
            }
            if (x === startX || y === endY - 1) {
                drawLine(x1 - 0.5, y1 + HALF_SQRT_3, x2 - 0.5, y2 + HALF_SQRT_3);
            }
            if (y === startY) {
                drawLine(x3 - 0.5, y3 - HALF_SQRT_3, x4 - 0.5, y4 - HALF_SQRT_3);
            }
        }
    }
}

function _drawTriangleGrid(startX: number, startY: number, endX: number, endY: number) {
    const diffY = endY - startY;
    const halfDiffY = diffY / 2;
    for (let x = startX; x <= endX; x++) {
        drawLine(x, startY * HALF_SQRT_3, x + halfDiffY, endY * HALF_SQRT_3);
    }
    for (let y = startY; y <= endY; y++) {
        const halfY = y / 2;
        drawLine(startX + halfY, y * HALF_SQRT_3, endX + halfY, y * HALF_SQRT_3);
    }
    {
        let x1 = startX + 1;
        let x2 = x1 - 0.5;
        let y1 = startY;
        let y2 = startY + 1;

        while (x1 < endX + halfDiffY) {
            drawLine(x1, y1 * HALF_SQRT_3, x2, y2 * HALF_SQRT_3);
            if (x1 < endX) {
                x1 += 1;
            } else {
                x1 += 0.5;
                y1 += 1;
            }

            if (x2 < startX + halfDiffY) {
                x2 += 0.5;
                y2 += 1;
            } else {
                x2 += 1;
            }
        }
    }
}

export function drawGrid(board: Board) {
    ctx.lineWidth = 1;

    const funs = {
        square: _drawSquareGrid,
        hex: _drawHexGrid,
        triangle: _drawTriangleGrid,
    };

    const fun = funs[board.gridType];
    let min = fromDrawPoint(0, 0);
    let max = fromDrawPoint(width, height);
    switch (board.gridType) {
        case 'hex':
            min = hexToCartesian(...min);
            max = hexToCartesian(...max);
            min[0] -= width / zoom;
            max[0] += width / zoom;
            break;
        case 'triangle':
            break;
    }
    min[0] = Math.floor(min[0]);
    min[1] = Math.floor(min[1]);
    max[0] = Math.floor(max[0] + 1);
    max[1] = Math.floor(max[1] + 1);
    if (board.minY !== undefined) {
        min[1] = board.minY;
    }
    if (board.maxY !== undefined) {
        max[1] = board.maxY;
    }
    if (board.minX !== undefined) {
        min[0] = board.minX;
    }
    if (board.maxX !== undefined) {
        max[0] = board.maxX;
    }
    fun(...min, ...max);
}

export function drawBoard(board: Board) {
    for (const [x, y, color] of board) {
        let x1 = x;
        let y1 = y;
        switch (board.gridType) {
            case 'hex':
                [x1, y1] = cartesianToHex(x, y);
            case 'square':
                drawCell(x1, y1, getHexForColor(color));
                break;
            case 'triangle':
                [x1, y1] = cartesianToHex(x, Math.floor(y / 2));
                x1 += 0.21; // TODO: Find correct offset
                if (mod(y, 2) === 1) {
                    y1 += HALF_ISQRT_3;
                    x1 += 0.5;
                }
                drawCell(x1, y1, getHexForColor(color), ISQRT_3); // TODO: After looking at the grid, I realise I don't want circles here
                break;
        }
    }
}

export function drawWinningLines(board: Board, winningLines: Vec2[][]) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const line of winningLines) {
        let [x1, y1] = line[0];
        let [x2, y2] = line[1];

        switch (board.gridType) {
            case 'square':
                [x1, y1] = [x1 + 0.5, y1 + 0.5];
                [x2, y2] = [x2 + 0.5, y2 + 0.5];
                break;
            case 'hex':
                [x1, y1] = cartesianToHex(x1, y1);
                [x2, y2] = cartesianToHex(x2, y2);
                y1 += 0.5;
                y2 += 0.5;
                x1 += 0.5;
                x2 += 0.5;
                break;
            case 'triangle':
                [x1, y1] = [x1 + 0.5, y1 + 0.5];
                [x2, y2] = [x2 + 0.5, y2 + 0.5];
                break;
        }
        drawLine(x1, y1, x2, y2);
    }
}

export function setZoomFactor(board: Board) {
    if (board.minX === undefined || board.maxX === undefined ||
        board.minY === undefined || board.maxY === undefined) {
        return;
    }
    let min: Vec2 = [board.minX, board.minY];
    let max: Vec2 = [board.maxX, board.maxY];

    switch (board.gridType) {
        case 'hex':
            min = cartesianToHex(...min);
            max = cartesianToHex(...max);
    }

    const w = max[0] - min[0];
    const h = max[1] - min[1];
    zoom = clamp(Math.min(width / w, height / h) * 0.95, minZoom, maxZoom);
    pos = [(width - w * zoom) / 2 + min[0], (height - h * zoom) / 2 + min[1]];
}
