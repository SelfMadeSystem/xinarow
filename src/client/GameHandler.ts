import { RoomOptions, ServerPackets } from "../share/Protocol";
import { awaitFor, awaitForAny, emit, uid } from "./socket";

let username = `user-${uid.substring(0, 8)}`;
{
    const localUsername = localStorage.getItem("xinarow-username");

    if (localUsername !== null) {
        username = localUsername;
    }
}

let commandHandler: (command: string) => boolean = () => false;

export function setCommandHandler(handler: (command: string) => boolean) {
    commandHandler = handler;
}

export function setUsername(s: string) {
    username = s;
    localStorage.setItem("xinarow-username", s);
}

export function getUsername() {
    return username;
}

export async function join(room: string) {
    emit("join", uid, username, room);

    const result = await awaitForAny("joinAccept", "joinReject");

    if (result[0] === "joinReject") {
        return (result[1] as ServerPackets["joinReject"])[0];
    }
    return result[1] as ServerPackets["joinAccept"];
}

export async function create(...args: [room: string, options: RoomOptions]) {
    emit("create", uid, username, ...args);

    const result = await awaitForAny("joinAccept", "joinReject");

    if (result[0] === "joinReject") {
        return (result[1] as ServerPackets["joinReject"])[0];
    }
    return result[1] as ServerPackets["joinAccept"];
}

export async function action(x: number, y: number) {
    emit("action", x, y);

    const result = await awaitForAny("actionReject", "actionTaken");

    return (
        result[0] === "actionTaken" ||
        (result[1] as ServerPackets["actionReject"])[0]
    );
}

export async function ping() {
    emit("ping", Date.now());
    await awaitFor("pong");
}

export function chat(message: string) {
    if (message.startsWith("/")) {
        if (commandHandler(message)) {
            return;
        }
    }
    emit("chat", message);
}
