const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('../utils/appError');
const {promisify} = require("util");
const Email = require('./../utils/email');
const crypto = require('crypto');

const signAccessToken = id =>{
    return  jwt.sign({id: id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
}

const signRefreshToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN})
}


const authHandler = async (req, res, next, token) => {
    let decoded;
    try {
        decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
        // console.log(err)
        return next(new appError('Invalid token', 401));
    }

    if (!decoded || !decoded.id) {
        return next(new appError('Token is missing user ID', 401));
    }
    const current_user = await User.findById(decoded.id)

    if (!current_user) {
        return next(new appError("the user belonging to this token does no longer exists!",401))
    }

    // 4 - check if user changed password after the token was issued

    if(current_user.changedPasswordAfter(decoded.iat)){
        return next(new appError("user recently changed password! please login again!", 401))
    }
    return current_user
}


const createSendToken = (user,statusCode,req , res)=>{
    const AccessToken = signAccessToken(user._id);
    const RefreshToken = signRefreshToken(user._id);
    const cookie_options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (req.secure) {
        cookie_options.secure = true
    }
    user.password = undefined
    res.cookie('jwt', RefreshToken, cookie_options)
    res.status(statusCode).json({
        status: 'success',
        data: {
            user,
            AccessToken
        }
    })
}


exports.signUp = catchAsync(async (req, res, next) => {
    const user = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
    }
    let newUser;
    try {
        newUser =  await User.create(user);
    }catch (err){
        return next(new appError(err, 400));
    }

    const token = newUser.createVerifyEmailToken();
    await newUser.save({validateBeforeSave: false})
    const urlToken = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${token}`
    try{
        await new Email(user, urlToken).sendWelcome()
    }
    catch (err){
        err.code = 1111
        await User.deleteOne(newUser._id)
        return next(new appError(err, 500))
    }
    createSendToken(newUser, 201, req,res);
});

exports.sginIn = catchAsync(async (req, res, next) => {
    const { username, password } = req.body;
    let user;
    if (!username || !password) {
        return next(new appError("email or password field is empty!", 400));
    }
    try{
        user = await User.findOne({username}).select("+password");
    }catch (err){
        return next(new appError(err, 400));
    }
    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new appError("email or password is incorrect!", 400));
    }
    createSendToken(user,200, req, res);
})

exports.protect = catchAsync(async (req,res,next)=>{
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    } else {
        return next(new appError("there is no token!", 401))
    }
// else if (req.cookies.jwt){
//         token = req.cookies.jwt;
//     }
    const current_user = await authHandler(req, res, next, token);
    if (!current_user || !current_user.username) return ;
    // GRANT access to protected Route!
    req.user = current_user;
    // for detail templates
    res.locals.user = current_user
    next()
})

exports.protectHomePage = catchAsync(async (req, res,next) => {
    let token;
    if (req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if (!token) {
        return res.status(401).json({status: 'fail', message: 'No token provided!'});
    }
    const current_user = await authHandler(req, res, next, token);

    if (!current_user.username) return ;

    if (!current_user.active && req.originalUrl !== "/verify-email"){
        req.tempUser = current_user;
        return res.redirect('/verify-email');
    }
    // GRANT access to protected Route!
    req.user = current_user;
    // for detail templates
    res.locals.user = current_user
    next()
})

exports.protectVerifyEmailPage = catchAsync(async (req, res,next) => {
    let token;
    if (req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if (!token) {
        return res.status(401).json({status: 'fail', message: 'No token provided!'});
    }
    const current_user = await authHandler(req, res, next, token);

    if (!current_user.username) return ;

    req.user = current_user;
    next()
})

exports.getAccessToken = catchAsync(async (req,res,next)=>{
    let refreshToken, AccessToken;
    if(req.cookies.jwt){
        refreshToken = req.cookies.jwt;
    }else {
        return res.status(400).json({
            status: "failed",
            message: "no ref token provided!"
        })
    }

    const current_user = await authHandler(req, res, next, refreshToken);
    if (!current_user.username) return ;

    AccessToken = signAccessToken(current_user._id)

    // GRANT access to protected Route!
    req.user = current_user;
    return res.status(200).json({
        message: "success",
        AccessToken: AccessToken
    })

})

exports.changePassword = catchAsync(async (req,res,next)=>{
    let user = await User.findById(req.user.id).select("+password")

    if (!user || !(await user.comparePassword(req.body.currentPassword, user.password))){
        return next(new appError("password is incorrect!", 400));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    // new token must be issued...
    const AccessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)
    const cookie_options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (req.secure) {
        cookie_options.secure = true
    }
    res.cookie('jwt', refreshToken, cookie_options);

    res.status(200).json({
        status: 'success',
        message: "password changed successfully!",
        AccessToken
    })

})

exports.verifyEmail = catchAsync(async (req,res,next)=>{
    const token = req.params.token;

    if (!token) return res.status(401).json({status: 'fail', message: 'No token provided!'});

    const hashedToken =  crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({verificationToken: hashedToken , verificationTokenExpires: {$gt: Date.now()}})
    if (!user) return next(new appError("incorrect token!", 401));

    user.active = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save({validateBeforeSave: false});

    // handel this part ...
    return res.status(200).redirect('/');

})