const mongoose = require('mongoose');
const Conversation = require('./conversationModel');
const {getIO} = require("./../socket")

const messageSchema = new mongoose.Schema({

    conversation: {
        type: mongoose.Schema.ObjectId,
        ref: 'Conversation',
        required: [true, 'chat message should have Conversation'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "chat message should belong to someone"],
    },
    text: {
        type: String,
        required: [true, "chat message should have a text"],
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    timestamp:{
        type: Date,
        default: Date.now
    }

})

messageSchema.index({conversation:1, timestamp:-1});


messageSchema.post("save", async function (){
    let io = getIO();
    let currentConv = await Conversation.findByIdAndUpdate(this.conversation, {
        lastMessage:{
            message: this._id,
            text: this.text,
            sender: this.user,
            timestamp: this.timestamp
        }
    },{ new: true })
    currentConv.members.forEach(el => {
        io.to(`user_${el}`).emit("new message", currentConv)
    })
})

const MessageModel = mongoose.model('Message',messageSchema);

module.exports = MessageModel;