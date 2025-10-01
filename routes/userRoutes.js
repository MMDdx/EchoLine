const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const upload = require('./../middlewares/upload');

router.route('/').post(authController.signUp)
router.post("/login", authController.sginIn);
router.get("/refresh", authController.getAccessToken)

router.get('/verify-email/:token', authController.verifyEmail)
router.use(authController.protect)

router.get("/search", userController.searchUsers);
router.get("/search/:userID", userController.searchForaUser);
router.patch("/updateMe", upload.uploadPhoto, upload.resizePhoto("user", 'users'),userController.updateMe);
router.patch("/updatePassword", authController.changePassword)



module.exports = router;
