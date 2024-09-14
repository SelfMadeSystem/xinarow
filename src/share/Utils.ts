export function jsonClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Transforms an integer into a natural number to be used as an array index.
 *
 * The integer is transformed into a natural number by multiplying the absolute
 * value of the integer by 2 and subtracting 1 if the integer is positive.
 * @param integer The integer to transform.
 * @returns The natural number.
 */
export function toNaturalNumber(integer: number): number {
    return Math.abs(integer) * 2 - (integer > 0 ? 1 : 0);
}

/**
 * Transforms a natural number that was used as an array index into an integer.
 *
 * The natural number is transformed into an integer by adding 1 to the number,
 * dividing the number by 2, rounding down, and multiplying the result by -1 if
 * the natural number is even.
 * @param naturalNumber The natural number to transform.
 * @returns The integer.
 */
export function fromNaturalNumber(naturalNumber: number): number {
    return (
        Math.floor((naturalNumber + 1) / 2) * (naturalNumber % 2 === 0 ? -1 : 1)
    );
}

/**
 * Prints and returns a value.
 *
 * This function is useful for debugging.
 * @param value The value to print.
 * @returns The value.
 */
export function print<T>(value: T): T {
    console.log(value);
    return value;
}

export function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(Math.min(value, max), min);
}

export type Vec2 = [x: number, y: number];

export function addVec2(a: Vec2, b: Vec2): Vec2 {
    return [a[0] + b[0], a[1] + b[1]];
}

export function subVec2(a: Vec2, b: Vec2): Vec2 {
    return [a[0] - b[0], a[1] - b[1]];
}

export function mulVec2(a: Vec2, b: Vec2): Vec2 {
    return [a[0] * b[0], a[1] * b[1]];
}

export function divVec2(a: Vec2, b: Vec2): Vec2 {
    return [a[0] / b[0], a[1] / b[1]];
}

export function floorVec2(a: Vec2): Vec2 {
    return [Math.floor(a[0]), Math.floor(a[1])];
}

export function ceilVec2(a: Vec2): Vec2 {
    return [Math.ceil(a[0]), Math.ceil(a[1])];
}

export function roundVec2(a: Vec2): Vec2 {
    return [Math.round(a[0]), Math.round(a[1])];
}

// Function that returns the hex's z position given x and y
export function hexZ(x: number, y: number): number {
    return -x - y;
}

const HALF_SQRT_3 = Math.sqrt(3) / 2;
const DBL_INV_SQRT_3 = 2 / Math.sqrt(3);

// Function that transforms a cartesian coordinate into a hex coordinate
export function cartesianToHex(x: number, y: number): Vec2 {
    return [x + y / 2, y * HALF_SQRT_3];
}

// Function that transforms a hex coordinate into a cartesian coordinate
export function hexToCartesian(x: number, y: number): Vec2 {
    y *= DBL_INV_SQRT_3;
    return [x - y / 2, y];
}

export function capitalizeFirst(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
