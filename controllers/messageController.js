const Message = require("./../models/messageModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getMessages = catchAsync(async (req, res, next) => {
    let convID = req.params.convID;
    let messages = await Message.find({conversation: convID}).sort({ timestamp: -1 });

    res.status(200).json({
        status: "success",
        length: messages.length,
        messages
    })
})
