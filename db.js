import mongoose from 'mongoose';
import 'dotenv/config'; 
const mongoUrl = process.env.MONGO_URI; 
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
export default db;