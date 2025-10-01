import { io } from "socket.io-client";
import {getAccessToken} from "./refreshTok";

export let socket = io({
    auth: {
        token: `Bearer ${getAccessToken()}`
    },
    reconnectionDelay: 1000,
});

