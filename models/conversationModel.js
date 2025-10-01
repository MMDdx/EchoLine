const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    isGroup:{
        type: Boolean,
        default: false
    },

    name:{
        type: String,
    },
    avatar: String,
    admin:{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    members:{
        type: [mongoose.Schema.ObjectId],
        ref: 'User',
        required: [true, "conversation must have members!"]
    },

    lastMessage: {
        text: String,
        message: mongoose.Schema.ObjectId,
        sender: {
            type:mongoose.Schema.ObjectId,
            ref: 'User'
        },
        senderUsername: String,
        timestamp: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: Date,
    seenBy:{
        type: Map,
        of: mongoose.Schema.ObjectId,
        default: {}
    }

})

conversationSchema.index({members: 1});

const ConversationModel = mongoose.model('Conversation',conversationSchema);
module.exports = ConversationModel;