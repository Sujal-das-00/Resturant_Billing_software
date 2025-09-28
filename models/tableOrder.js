import mongoose from "mongoose";

const tableOrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  items: [
    {
      item_name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    enum: ["card", "cash", "upi", null],
  },
  tableStatus: {
    type: String,
    default: "Booked",
  },
  tempToken: {
    type: String,
  },
});

const tableOrder = mongoose.model("tableOrder", tableOrderSchema);
export default tableOrder;
