const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({path: "./config.env"});
const app = require("./app");

mongoose.connect(process.env.ATLAS_DB, {
    useNewUrlParser: true,
})

const server = app.listen(3000,'0.0.0.0',(req, res)=>{
    console.log("server started on port ",3000)
})
process.on("uncaughtException", err => {
    console.log("ERROR: uncaughtException", err.message);
    server.close()
})