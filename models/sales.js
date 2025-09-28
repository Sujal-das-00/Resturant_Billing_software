import mongoose from "mongoose";
const SalesSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  day: {
    type: Number,
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  },
  Name_of_customer: {
    type: String,
    required: true,
  },
  Order_type: {
    type: String,
    default: "On resturant",
  },
  Payment_Metod: {
    type: String,
    required: true,
  },
  Total_bill: {
    type: Number,
    required: true,
  },
  Platform_charge: {
    type: Number,
    default: 1,
  },
});

SalesSchema.pre("save", function (next) {
  // 'this' refers to the document about to be saved

  // Only run this logic if the document is new or the date has been modified
  if (this.isNew || this.isModified("date")) {
    this.day = this.date.getDate();
    this.month = this.date.getMonth() + 1; // Add 1 because getMonth() is 0-indexed (Jan=0)
    this.year = this.date.getFullYear();
  }
  next();
});
const Sales = mongoose.model("Sales", SalesSchema);
export default Sales;
