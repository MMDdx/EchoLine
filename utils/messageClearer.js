const mongoose = require('mongoose')
const dotenv = require('dotenv');
const Message = require('./../models/messageModel');

dotenv.config({path: "./../config.env"});

mongoose.connect(process.env.LOCAL_DB, {
    useNewUrlParser: true,
});

const def = async () => await Message.deleteMany();
def()