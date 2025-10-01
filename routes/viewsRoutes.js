const viewController = require('./../controllers/viewsController');
const express = require('express');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get("/", viewController.getLoginPage)


router.get("/home" ,authController.protectHomePage,viewController.getHomePage);
router.get('/verify-email', authController.protectVerifyEmailPage, viewController.getVerifyEmailPage)

module.exports = router;