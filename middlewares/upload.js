const multer = require('multer');
const sharp = require("sharp");
const catchAsync = require("./../utils/catchAsync");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[0] === "image"){
        cb(null, true)
    }else {
        cb(new AppError("Not an image! please upload only images!", 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})

exports.uploadPhoto = upload.single('avatar');

exports.resizePhoto = (type, path="users") => {
    return catchAsync(async (req, res, next) => {
            if (!req.file) return next()
            req.file.filename = `${type}-${req.user._id}-${Date.now()}.jpeg`

            await sharp(req.file.buffer).resize(500, 500)
                .toFormat('jpeg')
                .jpeg({quality: 90})
                .toFile(`public/img/${path}/${req.file.filename}`)

            next()
        }
    )
}