import { io } from "socket.io-client";
import { v4 } from "uuid";
import {
    ClientPacketNames,
    ClientPackets,
    emitPacket,
    ServerPacketNames,
    ServerPackets,
} from "../share/Protocol";

export const uid = v4();

const multiplayerSupport = import.meta.env.VITE_MULTIPLAYER === "true";

const listeners = new Map<ServerPacketNames, Function[]>();

const protocol = (() => {
    switch (location.protocol) {
        case "http:": {
            return "ws:";
        }
        case "https:": {
            return "wss:";
        }
    }
    throw new Error(`Unknown protocol: ${location.protocol}`);
})();
const host = `${protocol}//${location.host}`;

const path = location.pathname;

if (multiplayerSupport) {
    console.log("connecting to " + host);
}

export const socket = io(host, {
    transports: ["websocket"],
    path: path + "socket.io",
});

socket.on("connect", () => {
    console.log("connected");
    socket.emit("uid", uid);
});

socket.on("disconnect", () => {
    console.log("disconnected");
});

socket.on("error", (err) => {
    console.log("error: ", err);
});

if (multiplayerSupport) {
    socket.connect();
} else {
    console.log("Multiplayer support disabled");
}

export function on(event: ServerPacketNames, listener: Function) {
    if (!listeners.has(event)) {
        socket.on(event, (...e) => {
            const listenerers = listeners.get(event);
            if (listenerers) {
                listenerers.forEach((l) => {
                    try {
                        l(...e);
                    } catch (e) {
                        console.error(e);
                    }
                });
            }
        });
        listeners.set(event, []);
    }
    listeners.get(event)!.push(listener);
}

export function off(event: ServerPacketNames, listener: Function) {
    if (!listeners.has(event)) {
        return;
    }
    const arr = listeners.get(event)!;
    const i = arr.indexOf(listener);
    if (i > -1) {
        arr.splice(i, 1);
    }
}

export function awaitFor<e>(event: ServerPacketNames): Promise<e> {
    return new Promise<e>((resolve) => {
        const f = (a: e) => {
            off(event, f);
            resolve(a);
        };
        on(event, f);
    });
}

export function awaitForAny<Names extends Array<ServerPacketNames>>(
    ...events: Names
): Promise<[Names[number], ServerPackets[Names[number]]]> {
    return new Promise<[ServerPacketNames, ServerPackets[ServerPacketNames]]>(
        (resolve) => {
            const fs = events.map<[ServerPacketNames, Function]>((event) => {
                const f = (...a: any) => {
                    fs.forEach((t) => off(t[0], t[1]));
                    resolve([event, a]);
                };
                on(event, f);
                return [event, f];
            });
        }
    ) as Promise<[Names[number], ServerPackets[Names[number]]]>;
}

export function emit<Name extends ClientPacketNames>(
    name: Name,
    ...event: ClientPackets[Name]
) {
    emitPacket<ClientPacketNames>(socket, name, ...event);
}
