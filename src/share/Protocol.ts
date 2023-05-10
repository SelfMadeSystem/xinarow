import { PlayerColor } from "./PlayerColor";
import { jsonClone } from "./Utils";

export type GridType = "square" | "hex" | "triangle";
export type TeamOrder = "random" | "join";

export type RoomOptions = {
    nInARow: number,
    teamCount: PlayerColor,
    teamSize: number, // 1 for most games
    gravity: boolean,
    gridType: GridType,
    teamOrder: TeamOrder,
    width: number,
    height: number,
    expandLength: number,
    expandDensity: number,
    densityPercent: boolean,
}

/**
 * Defines the packets for the client to server communication.
 */
export type ClientPackets = {
    // Pings the server with a timestamp. The server will respond with a pong packet.
    ping: [timestamp: number];
    // Tells the server the client's UID
    uid: [string];
    // Asks to join a room.
    join: [
        uid: string,
        username: string,
        room: string,
    ]
    // Creates a room
    create: [
        uid: string,
        username: string,
        roomName: string,
        options: RoomOptions
    ]
    // Action. Places a piece on the board.
    action: [x: number, y: number];
    // Chat message. String is not sanitized nor is it sanitized on the server.
    // It is up to the client to sanitize the string.
    chat: [message: string];
}

export type ServerPackets = {
    // Responds to a ping packet.
    pong: [timestamp: number];
    // Accepts a join request. Tells the client what color they are.
    joinAccept: [
        options: RoomOptions,
    ];
    // Rejects a join request. Tells the client why.
    joinReject: [
        reason: string,
    ];
    // Tells the client the players in the room.
    players: [
        users: string[], // names. No need for IDs.
    ];
    // Tells the client the game started
    gameStarted: [
        turn: number,
    ];
    // Notifies the client that an action can't be performed.
    actionReject: [
        reason: string,
    ];
    // Notifies the client of an action.
    actionTaken: [
        x: number,
        y: number,
        color: PlayerColor,
        playerTurn: number, // indicating who's turn it is next
    ];
    // Chat message.
    playerChat: [
        username: string,
        message: string,
    ];
    // Tells the client the game is over because someone won.
    gameWon: [
        winner: PlayerColor,
        winningLines: [x: number, y: number][][],
    ];
    // Tells the client the game is over because the room was closed.
    gameEnd: [reason: string];
}

export type ClientPacketNames = keyof ClientPackets;
export type ServerPacketNames = keyof ServerPackets;

// Utilities

export type Packets = ClientPackets & ServerPackets;
export type PacketNames = keyof Packets;

export function emitPacket<Name extends ClientPacketNames | ServerPacketNames>(emitter: {
    emit: (arg0: string, ...arg1: any[]) => any;
}, name: Name, ...packet: (ClientPackets & ServerPackets)[Name]) {
    const newPacket = jsonClone(packet);

    emitter.emit(name, ...newPacket);
}

export function onPacket<Name extends ClientPacketNames | ServerPacketNames>(emitter: {
    on: (arg0: string, arg1: (...arg1: any) => void) => any;
}, name: Name, listener: (...arg1: (ClientPackets & ServerPackets)[Name]) => void) {
    emitter.on(name, listener);
}

export function offPacket<Name extends ClientPacketNames | ServerPacketNames>(emitter: {
    off: (arg0: string, arg1: (...arg1: any) => void) => any;
}, name: Name, listener: (...arg1: (ClientPackets & ServerPackets)[Name]) => void) {
    emitter.off(name, listener);
}
