const mongoose = require ('mongoose');
const { type } = require('os');
const personSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    Table_no:{
        type:Number,
        required:true
    },
    items:[
        {item_name:{type:String,required:true},
        quantity:{type:Number,required:true},
        price:{type:Number,required:true}}
    ],
    total_price:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        default:"Pending",
    },
    paymentMethod:{
        type:String,
        enum:["card","cash","upi"],
        required:true
    },
    table_status:{
        type:String,
        default:"Booked"
    },
    tempToken:{
        type:String,
        required:true
    }
});

const Person = mongoose.model('Person',personSchema);
module.exports = Person;