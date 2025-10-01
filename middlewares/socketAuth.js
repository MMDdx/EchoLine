const User = require('./../models/userModel');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const AppError = require("../utils/appError");
const {promisify} = require("util");

module.exports = async (socket, next) => {
    let decoded;
    try {
        // 1) Grab the token from the initial auth payload
        let raw = socket.handshake.auth?.token;
        if (!raw || !raw.startsWith("Bearer ")) {
            return next(new AppError("Authentication token missing", 401));
        }
        const token = raw.split(" ")[1];

        // 2) Verify access token
        try {
            decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        }
        catch (e){
            console.log(e)
            if (String(e).includes("jwt expired")){
                return next(new AppError("jwt expired!!", 401));
            }
            return next(new AppError("token not verified!!", 401));
        }

        if (!decoded?.id) {
            return next(new AppError("Invalid token", 401));
        }

        // 3) Check that user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError("User no longer exists", 401));
        }

        // 4) (Optional) Check password changed after token issuance
        if (user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError("Password recently changed; please log in again", 401));
        }

        // 5) Attach user to socket
        socket.user = user;
        next();
    } catch (err) {
        next(new AppError("Socket authentication failed", 401));
    }
};