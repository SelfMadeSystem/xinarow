import { PlayerColor, getHexForColor } from "../share/PlayerColor";
import { Vec2, clamp } from "../share/Utils";
import Board from "../share/Board";

export const canvas = document.getElementById('canvas') as HTMLCanvasElement
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
    }

    const up = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        canvas.removeEventListener('mousemove', move);
        canvas.removeEventListener('mouseup', up);


        if (tap) {
            tapObservers.forEach(cb => cb(mousePos));
        }
    }

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
    }

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
            pos = newPos; // FIXME

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
    }

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
    }

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

export function drawCell(x: number, y: number, color: PlayerColor) {
    const [x1, y1] = toDrawPoint(x, y);
    const [x2, y2] = toDrawPoint(x + 1, y + 1);
    ctx.fillStyle = getHexForColor(color);
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

export function drawSetCell(cell: Vec2 | undefined) {
    if (cell === undefined) {
        return;
    }
    ctx.fillStyle = '#fff9';
    fillRect(...cell, cell[0] + 1, cell[1] + 1);
}

function _drawGrid(startX: number, startY: number, endX: number, endY: number) {
    for (let x = startX; x <= endX; x++) {
        drawLine(x, startY, x, endY);
    }
    for (let y = startY; y <= endY; y++) {
        drawLine(startX, y, endX, y);
    }
}

export function drawGrid(w?: number, h?: number) {
    ctx.lineWidth = 1;
    if (w && h) {
        _drawGrid(0, 0, w, h);
        return;
    }
    const min = fromDrawPoint(0, 0);
    const max = fromDrawPoint(width, height);
    min[0] = Math.floor(min[0]);
    min[1] = Math.floor(min[1]);
    max[0] = Math.floor(max[0] + 1);
    max[1] = Math.floor(max[1] + 1);
    _drawGrid(...min, ...max);
}

export function drawBoard(board: Board) {
    for (const [x, y, color] of board) {
        drawCell(x, y, color);
    }
}

export function drawWinningLines(winningLines: Vec2[][]) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const line of winningLines) {
        drawLine(line[0][0] + 0.5, line[0][1] + 0.5, line[1][0] + 0.5, line[1][1] + 0.5);
    }
}

export function setZoomFactorForSize(w: number, h: number) {
    zoom = clamp(Math.min(width / w, height / h) * 0.95, minZoom, maxZoom);
    pos = [(width - w * zoom) / 2, (height - h * zoom) / 2];
}