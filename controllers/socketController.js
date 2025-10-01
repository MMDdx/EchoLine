const he = require('he');
const Message = require("./../models/messageModel");
const catchAsync = require("./../utils/catchAsync");
const Conversation = require("./../models/conversationModel");

exports.chatMessage = (io, socket) => {
    const currentUser = socket.user;

    socket.on("chat message",catchAsync(async (data) => {
            const CleanMessage = he.encode(data.text)

            let newMessage = await Message.create({
                // this must be changed...
                conversation: data.conversation,
                user: currentUser._id,
                text: CleanMessage,
            })

            io.to(data.conversation).emit("chat message", {
                text: CleanMessage,
                senderId: currentUser._id,
                username: currentUser.username,
                timestamp: newMessage.timestamp,
                _id: newMessage._id
            })

            // io.to(`user_${currentUser._id}`).emit("new message", newMessage)
        })
    )
}


exports.joinRoom = (io, socket) => {
    socket.join(`user_${socket.user._id}`);

    socket.on("join room", convID => {
        socket.join(convID);
    })
}

exports.exitRoom = (io, socket) => {
    socket.on("leave room", convID => {
        socket.leave(convID);
    })
}

exports.onlineStatus = (io, socket) => {
    socket.emit("change status", {
        status: true
    });
}

exports.offlineStatus = (io, socket) => {
    socket.emit("change status", {
        status: false
    })
}

exports.seenMsg = (io, socket) => {

    socket.on("seen message", async ({ conversationId, messageId }) => {
        if (!socket.user?._id || !conversationId || !messageId) return;
        console.log(conversationId, messageId);
        try {
            // Atomically set the last‐seen message for this user
            await Conversation.findByIdAndUpdate(conversationId, {
                $set: { [`seenBy.${socket.user._id}`]: messageId }
            });

            // (Optional) Notify the room that this user has progressed
            socket.to(conversationId).emit("user seen update", {
                conversationId,
                userId: socket.user._id,
                messageId
            });
        } catch (err) {
            console.error("Error updating seenMap:", err);
        }
    });
}

