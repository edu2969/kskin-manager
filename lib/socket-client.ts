"use client";

import io from "socket.io-client";
export const socket = io(process.env.SOCKET_HOSTNAME || "https://centrointegral.kskin.cl", {
    transports: ["websocket"]
});
