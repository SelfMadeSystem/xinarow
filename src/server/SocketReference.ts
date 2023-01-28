import { Socket } from "socket.io";

export class SocketRef {
    private onMap: Map<string, ((...e: any) => void)[]> = new Map();
    constructor(private socket: Socket) {
    }

    public on(e: string, cb: (...e: any) => void) {
        if (!this.onMap.has(e)) {
            this.onMap.set(e, []);
        }

        this.onMap.get(e)!.push(cb);

        this.socket.on(e, cb);
    }

    public off(e: string, cb: (...e: any) => void) {
        const arr = this.onMap.get(e);
        if (arr === undefined) {
            return;
        }

        const index = arr.indexOf(cb);

        if (index > 0) {
            arr.splice(index, 1);
        }


        this.socket.off(e, cb);
    }

    public emit(e: string, ...args: any[]) {
        this.socket.emit(e, ...args);
    }

    public setSocket(socket: Socket) {
        this.socket = socket;
        for (const event of this.onMap.keys()) {
            for (const l of this.onMap.get(event)!) {
                socket.on(event, l);
            }
        }
    }

    public callIfNotReplaced(cb: () => void, timeout: number = 5 * 1000) {
        const socket = this.socket;
        setTimeout(() => {
            if (this.socket === socket) {
                cb();
            }
        }, timeout);
    }
}

export class SocketReferences {
    private map: Map<string, SocketRef> = new Map();

    public newSocket(socket: Socket): Promise<SocketRef | void> {
        return new Promise(resolve => {
            let listener: (uid: string) => void;
            socket.on("uid", listener = (uid: string) => {
                // FIXME: This is unsafe. Clients can spoof their uid.
                // It would be better for the server to generate a random uid,
                // send it to the client and wait for the client to confirm it.
                socket.off("uid", listener);

                let ref = this.map.get(uid);

                if (ref === undefined) {
                    this.map.set(uid, ref = new SocketRef(socket));
                    resolve(ref);
                } else {
                    ref.setSocket(socket);
                    resolve();
                }
            });
        });
    }
}