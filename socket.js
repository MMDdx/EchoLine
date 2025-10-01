const { Server } = require("socket.io");
let io;

module.exports = {
    init: (server) => {

        io = new Server(server, {
            cors: {
                origin: "http://127.0.0.1:3000", // Make sure this has http://
                credentials: true
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};