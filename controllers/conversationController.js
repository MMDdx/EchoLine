const catchAsync = require("./../utils/catchAsync");
const Conversation = require("./../models/conversationModel")
const { getIO } = require("./../socket.js");
const AppError = require("./../utils/AppError");
const he = require("he")

exports.createConversation =catchAsync(async (req, res, next) => {
    const io = getIO();
    let {members} = req.body
    if(typeof members === "string"){
        members = JSON.parse(members);
    }
    if (!Array.isArray(members)){
        return next(new AppError("Invalid data", 400));
    }

    if (members.length > 2) req.body.isGroup = true;
    if (req.body.isGroup){
        req.body.admin = req.user._id;
        if (req.file) req.body.avatar = req.file.filename;
    }
    req.body.members = members;

    let ConvArgs = {...req.body}
    if (req.body.lastMessage) ConvArgs.lastMessage = {

        text: he.encode(req.body.lastMessage.text),
        sender: req.body.lastMessage.sender,
        senderUsername: req.body.lastMessage.myUsername,
        timestamp: Date.now(),
    };

    const newConv = await Conversation.create(ConvArgs);

    req.body.members.forEach(el => {
        io.to(`user_${el}`).emit("new conversation", newConv)
    })


    res.status(200).json({
        status: "success",
        message: "Conversation created successfully",
        data: newConv._id,
    });
})

// ...
exports.getConversations = catchAsync(async (req, res, next) => {
    const currentUser = req.user;

    const conversations = await Conversation.find({
        members: currentUser._id
    }).populate("members", "username");

    res.status(200).json({
        status: "success",
        data: conversations
    })
})