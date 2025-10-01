const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.searchUsers = catchAsync(async (req, res, next) => {
    const query = req.query.query;

    if (!query && query.trim() === "") {
        return res.status(400).json([])
    }
    const users = await User.find({username: {$regex: query, $options : 'i'}})
        .limit(10)
        .select("username _id avatar")

    return res.status(200).json(users);
})

exports.searchForaUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.userID).select("username _id avatar");

    if (!user) {
        return res.status(404).json({
            status: "success",
            message: "User not found",
        })
    }
    return res.status(200).json({
        status: 'success',
        message: "found!",
        data: user
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    const currentUser = req.user;

    const {username, firstName, lastName} = req.body;
    let updateArgs = {};

    if (username && username !== currentUser.username) updateArgs.username = username;
    if (firstName && firstName !== currentUser.firstName) updateArgs.firstName = firstName;
    if (lastName && lastName !== currentUser.lastName) updateArgs.lastName = lastName;

    if (req.file) updateArgs.avatar = req.file.filename;

    if (Object.keys(updateArgs).length === 0) {
        return res.status(400).json({ status: 'fail', message: 'No data or New data provided' });
    }

    await User.findByIdAndUpdate(currentUser._id, updateArgs, {
        runValidators: true,
    });
    return res.status(200).json({
        status: 'success',
        message: "updated successfully",
    })
})
