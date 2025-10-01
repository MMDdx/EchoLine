const express = require('express');
const http = require('http');
const { init } = require("./socket.js")
const path = require("path");
const ejs = require("ejs");
const app = express();
const server = http.createServer(app)
const socketAuth = require("./middlewares/socketAuth");
const conversationRouter = require("./routes/conversationRoutes")

const io = init(server);

process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION 🔥", err.message);
    console.error(err.stack);
    process.exit(1);
});

const viewsRouter = require("./routes/viewsRoutes");
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const messageRouter = require("./routes/messageRoutes");
const globalErrorHandler = require("./controllers/errorController");
const cookieParser = require("cookie-parser");
const socketController = require("./controllers/socketController")
const AppError = require("./utils/appError");
// middleware for auth in socket.io
io.use(socketAuth);

io.on("connection", (socket) => {
    socketController.joinRoom(io,socket);
    socketController.onlineStatus(io, socket);
    socketController.chatMessage(io,socket);
    socketController.exitRoom(io,socket);
    socketController.seenMsg(io,socket);

    socket.on("disconnect", (reason) => {
        socketController.offlineStatus(io, socket);
    })
})

app.engine("ejs" , ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/templates'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// routes
app.use("/", viewsRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/messages", messageRouter);

// 404 handler — this is valid in both Express 4 and 5
// app.all("/*anything", (req, res, next) => {
//     next(new AppError(`Could not find ${req.originalUrl} on this server!`, 404));
// });

app.use(globalErrorHandler);

module.exports = server;