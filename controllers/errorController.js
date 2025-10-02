const AppError = require("./../utils/appError")


const handleCastErrorDB = err =>{
    const message = `invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err =>{
    const value = err.message.match(/"([^"\\]|\\.|\\\n)*"|'([^'\\]|\\.|\\\n)*'/)

    const message = `Duplicate field val ${value} please use another!`;
    return new AppError(message, 400)
}

const handleEmailSendingError = err => {
    const message = "Something went Wrong during sending email to you!please sign up again later!"
    return new AppError(message, 500)
}

const sendErrorDev = (err,req, res) => {
    if (req.originalUrl.startsWith("/api")){
        return res.status(err.statusCode).json({
            status: err.statusCode,
            message: err.message,
            stack: err.stack,
            err
        })
    }
}

const sendErrorProduction =  (err,req, res) => {
    if (req.originalUrl.startsWith("/api")){
        if (err.isOperational){
            return res.status(err.statusCode).json({
                status: err.statusCode,
                message: err.message,
            })
        }
        return res.status(err.statusCode).json({
            status: err.statusCode,
            message: "something went wrong, please try again later!"
        })
    }
    else {
        return res.status(500).json({
            status: 'error',
            message: "something went wrong!"
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500

    err.status = err.status || "error";
    if (process.env.NODE_ENV === "development"){
        sendErrorDev(err,req,res)
    }
    else if(process.env.NODE_ENV === "production"){
        let error = {...err};
        error.message = err.message;

        if (err.name === "CastError"){
            error = handleCastErrorDB(err)
        }
        else if (err.code === 11000){
            error = handleDuplicateFieldsDB(err)
        }
        else if (err.code === 1111){
            error = handleEmailSendingError(err)
        }
        sendErrorProduction(error,req,res)
    }

}