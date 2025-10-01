const express = require('express');
const authController = require('./../controllers/authController');
const conversationController = require('./../controllers/conversationController');
const router = express.Router();
const upload = require("./../middlewares/upload");

router.use(authController.protect)

router.route("/")
    .post(upload.uploadPhoto, upload.resizePhoto("group","groups"), conversationController.createConversation)
    .get(conversationController.getConversations);

module.exports = router;
