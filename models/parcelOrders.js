import mongoose from "mongoose";
const parcelShema = new mongoose.Schema({
  customerName: {
    type: String,
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
    enum: ["card", "cash", "upi"],
    required: true,
  },
  parcelId: {
    type: String,
    required: true,
  },
});
const parcelOrder = mongoose.model("parcelOrder", parcelShema);
export default parcelOrder;
