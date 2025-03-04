export enum PlayerColor {
    Red,
    Green,
    Blue,
    Yellow,
    Magenta,
    Cyan,
    Orange,
    Pink,
}

export function getHexForColor(color: PlayerColor): string {
    switch (color) {
        case PlayerColor.Red:
            return "#ff0000";
        case PlayerColor.Green:
            return "#00ff00";
        case PlayerColor.Blue:
            return "#0000ff";
        case PlayerColor.Yellow:
            return "#ffff00";
        case PlayerColor.Magenta:
            return "#dd00bb";
        case PlayerColor.Cyan:
            return "#00ffff";
        case PlayerColor.Orange:
            return "#ff8000";
        case PlayerColor.Pink:
            return "#ff80ff";
    } // TODO: Custom colors + colorblind mode (letters instead of colors)
}

export function colorName(color: PlayerColor) {
    switch (color) {
        case PlayerColor.Red:
            return "red";
        case PlayerColor.Green:
            return "green";
        case PlayerColor.Blue:
            return "blue";
        case PlayerColor.Yellow:
            return "yellow";
        case PlayerColor.Magenta:
            return "magenta";
        case PlayerColor.Cyan:
            return "cyan";
        case PlayerColor.Orange:
            return "orange";
        case PlayerColor.Pink:
            return "pink";
    }
    throw new Error(`Unknown color ${color}`);
}
