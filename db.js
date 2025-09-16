const mongoose = require ('mongoose');
const mongoUrl = 'mongodb://localhost:27017/hotels';
mongoose.connect(mongoUrl)

const db = mongoose.connection;

db.on('connected',()=>{
    console.log("Connected");
});
db.on('error',()=>{
    console.log("an error occured in connection");
})
db.on('disconnected',()=>{
    console.log("Database is disconnected");
})

module.exports = db;