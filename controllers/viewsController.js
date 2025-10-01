const Conversation = require("../models/conversationModel");

exports.getLoginPage = (req,res,next) =>{
    res.status(200).render("login")
}

exports.getHomePage = async (req,res,next) =>{
    const currentUser = req.user;

    const conversations = await Conversation.find({
        members: currentUser._id
    }).populate("members", "username avatar");
    conversations.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || 0;
        const timeB = b.lastMessage?.timestamp || 0;
        return timeB - timeA;
    });
    let seenBys = {};
    let usersById = {};
    usersById[req.user._id] = {
        username: req.user.username,
        avatar: req.user.avatar,
    }
    conversations.forEach(chat => {
        seenBys[chat._id] = chat.seenBy;

        chat.members.forEach(user => {
            if (!usersById[user._id]) {
                usersById[user._id] = {
                    username: user.username,
                    avatar: user.avatar
                };
            }
        });
    });

    res.status(200).render("home", {user: res.locals.user, chats: conversations, UsersCache:usersById, seenBys})
}


exports.getVerifyEmailPage = async (req,res,next) =>{
    const current_user = req.user;

    if (current_user.active){
        return res.status(200).redirect('/home');
    }

    return res.status(200).render("verifyEmail", {
        firstName: current_user.firstName,
        email: current_user.email,
    });
}