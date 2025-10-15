import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import "./db.js";
import bodyParser from "body-parser";
// Model and Query imports
import tableOrder from "./models/tableOrder.js";
import Sales from "./models/sales.js";
import parcelOrder from "./models/parcelOrders.js";
import { getTodaysTotal } from "./dbQuerres/dailySaleQueerry.js";
import { getMonthlyTotal } from "./dbQuerres/monthlySalesQuerry.js";
import { getYearlyTotal } from "./dbQuerres/yearlysaleQuerry.js";
import { getMonthlyChartData } from "./dbQuerres/totalsalesYearwise.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(bodyParser.json());
export const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.get("/date", (req, res) => {
  const now = new Date();

  const day = now.getDate(); // 1 - 31
  const month = now.getMonth() + 1; // 0 = Jan, so +1 → 1 - 12
  const year = now.getFullYear(); // e.g. 2025

  res.json({
    day,
    month,
    year,
    fullDate: now,
  });
});

app.delete("/delete/data/all", async (req, res) => {
  try {
    await tableOrder.deleteMany({});
    await parcelOrder.deleteMany({});
    await Sales.deleteMany({});
    res.sendStatus(200); // correct
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

//creating connection as well as listening for a particular data here order
io.on("connection", (socket) => {
  console.log("Socket created sucesssfully");
  socket.on("disconnect", () => {
    console.log(`Socket disconnected with ID: ${socket.id}`);
  });
});
// io.on('connection', (socket) => {
//     console.log("2nd socket created sucessfully");
//     socket.on('parcel', (data) => {
//         console.log("parcel send sucessfully", data);
//         socket.broadcast.emit('parcel', data)
//     })
// })

//temperory
app.get("/get", async (req, res) => {
  try {
    const get = await tableOrder.find();
    res.send(get);
  } catch (error) {
    res.status(500);
  }
});

//sales data for the revenue panel
app.get("/getSalesData", async (req, res) => {
  const DailySale = await getTodaysTotal();
  const Monthlysale = await getMonthlyTotal();
  const Yearlysale = await getYearlyTotal();
  res.status(200).json({
    dailySale: DailySale,
    monthlysale: Monthlysale,
    yealysale: Yearlysale,
  });
});

app.get("/check", async (req, res) => {
  res.send(await Sales.find());
});

app.get("/parcel", async (req, res) => {
  res.send(await parcelOrder.find());
});

//check if payment done
app.get("/api/customer/:tokenId", async (req, res) => {
  const token = req.params.tokenId;
  const data = await tableOrder.findOne({ tempToken: token });
  res.json({ paymentStatus: data.paymentStatus });
});

//check if table exixst
app.get("/api/customer/table/:tableNumber_To_Check", async (req, res) => {
  const tableNo = Number(req.params.tableNumber_To_Check);
  const data = await tableOrder.findOne({ tableNumber: tableNo });
  res.status(200).json({ tableStatus: data.tableStatus });
});

app.post("/save/table", async (req, res) => {
  try {
    const newOrder = new tableOrder(req.body);
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error saving order", error: error });
  }
});

//on click of free table sales data save and patch to the orderstable
async function SaveDataToSalesTable(salesdata) {
  try {
    const data = salesdata;
    const NewSale = new Sales(data);
    await NewSale.save();
    console.log("Sales data save sucessfully..!");
  } catch (error) {
    console.log("error occured ", error);
    throw new Error("Failed to save data to sales table.", error);
  }
}

//database save api for orders on conform order button click
app.patch("/api/orders", async (req, res) => {
  try {
    const { tableNumber, ...updateData } = req.body;

    if (tableNumber > 15) {
      return res.status(400).json({ message: "Table limit exceeded" });
    }
    // Basic validation: Ensure tableNumber is provided
    if (!tableNumber) {
      return res
        .status(400)
        .json({ message: "tableNumber is a required field." });
    }
    const updatedOrder = await tableOrder.findOneAndUpdate(
      { tableNumber: tableNumber }, // The condition to find the document
      { $set: updateData }, // The data to update/set
      { new: true, upsert: true, runValidators: true }
    );
    console.log(`Table #${tableNumber} data updated successfully.`);

    // Using socket.io, broadcast the updated order to all connected clients.
    io.emit("tableOrder", updatedOrder);
    console.log(`Broadcasted update for Table #${tableNumber} to all clients.`);

    // Send a success response back to the original requester.
    res.status(200).json({
      message: `Table number ${tableNumber} Booked successfully.`,
      data: updatedOrder,
    });
  } catch (err) {
    console.error("Error in PATCH /api/orders:", err);
    res.status(500).json({
      message: "Cannot booked table please try again :)",
      error: err.message,
    });
  }
});

//free table  btn api update on basis of table no
app.patch("/api/update/bookingstatus", async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const dataObject = req.body;
    const datatoSaveOnSalesTable = {
      Name_of_customer: dataObject.customerName,
      Payment_Metod: dataObject.paymentMethod,
      Total_bill: dataObject.totalPrice,
      Order_type: dataObject.Order_type,
    };
    await SaveDataToSalesTable(datatoSaveOnSalesTable);
    //  Validate the input. If no table number is provided, we can't proceed.
    if (!tableNumber) {
      return res
        .status(400)
        .json({ message: "tableNumber is required in the request body." });
    }
    // 3. Find the specified table and update its fields.
    const updatedTable = await tableOrder.findOneAndUpdate(
      { tableNumber: tableNumber },
      {
        $set: {
          customerName: "",
          items: [],
          totalPrice: 0,
          paymentStatus: "null",
          paymentMethod: "null",
          tableStatus: "Vacant",
          tempToken: "",
        },
      },
      { new: true }
    );
    //Handle the case where the table number doesn't exist.
    if (!updatedTable) {
      return res
        .status(404)
        .json({ message: `Table with number ${tableNumber} not found.` });
    }
    // Send a success response.
    res.status(200).json({
      message: `Table ${tableNumber} has been cleared and is now available.`,
      data: updatedTable,
    });
  } catch (err) {
    // Handle any potential server or database errors.
    console.error("Error clearing table status:", err);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: err.message,
    });
  }
});

// A PATCH request to a URL like /api/rejectOrder/5 will be handled here.
app.patch("/api/rejectOrder/:table_no", async (req, res) => {
  try {
    const { table_no } = req.params;
    const updatedTable = await tableOrder.findOneAndUpdate(
      { tableNumber: table_no },
      {
        $set: {
          customerName: "",
          items: [],
          totalPrice: 0,
          paymentStatus: "null",
          paymentMethod: "null",
          tableStatus: "Vacant",
        },
      },
      { new: true }
    );
    res.status(200).json({
      message: `Order for table ${table_no} has been rejected and the table is now available.`,
      data: updatedTable,
    });
  } catch (err) {
    console.error("Error rejecting order:", err);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: err.message,
    });
  }
});

//api for parcel posting it saves the data tp parels table temperorly
app.post("/api/parcels", async (req, res) => {
  try {
    const parcelData = req.body;
    // Basic validation
    if (
      !parcelData.customerName ||
      !parcelData.items ||
      parcelData.items.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields for parcel order." });
    }
    const newParcel = new parcelOrder(parcelData);
    const simpleId = Math.random().toString(36).substring(2);
    // Save the new document to the database.
    newParcel.parcelId = simpleId;
    const savedParcel = await newParcel.save();
    console.log(
      `New parcel order #${savedParcel._id} saved successfully to DB.`
    );

    // Broadcast the complete, saved parcel object to all clients
    io.emit("newParcel", savedParcel);
    console.log(
      `Broadcasted new parcel #${savedParcel._id} to all dashboards.`
    );

    //Send a success response back to the client that placed the order.
    res.status(201).json({
      message: "Parcel order created successfully.",
    });
  } catch (err) {
    console.error("Error in POST /api/parcels:", err);
    res
      .status(500)
      .json({ message: "Failed to create parcel order.", error: err.message });
  }
});

//save the data to sales table as well as vaccant the database of parcels orders
app.delete("/api/parcel/Save-And-delete", async (req, res) => {
  try {
    const dataObject = req.body;
    const dataToSave = {
      Name_of_customer: dataObject.customerName,
      Payment_Metod: dataObject.paymentMethod,
      Total_bill: dataObject.totalPrice,
      Order_type: dataObject.Order_type,
    };
    const parcelId = dataObject.parcelId;
    await SaveDataToSalesTable(dataToSave);
    if (!parcelId)
      return res.status(500).json({ messge: "provide parcel id " });
    const deleteParcel = await parcelOrder.deleteOne({ parcelId: parcelId });
    res.status(200).json({ message: "parcel completed " });
  } catch (error) {
    console.error("Error in saving parcel", err);
    res.status(500).json({
      message: "Failed to save parcel order in sales table.",
      error: err.message,
    });
  }
});

app.delete("/api/reject/parcel/:parcelidTodelete", async (req, res) => {
  try {
    const { parcelidTodelete } = req.params;
    const result = await parcelOrder.deleteOne({ parcelId: parcelidTodelete });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Parcel ID was not found." });
    }
    res.status(200).json({ message: "parcel rejected Sucessfully" });
  } catch (error) {
    res.send(500).json({ messge: "Cannot delete the requested parcel" });
  }
});

app.get("/api/sync-data", async (req, res) => {
  try {
    // Fetch both collections in parallel
    const [tables, orders] = await Promise.all([
      tableOrder.find({}), // Or whatever your table model is
      parcelOrder.find({}), // Or whatever your order model is
    ]);

    // Send both arrays back in a single JSON object
    res.status(200).json({ tables, orders });
  } catch (error) {
    console.error("Error fetching all data for sync:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch data from the database." });
  }
});

app.get("/api/getdata/sales", async(req,res)=>{
  try {
    const targetYear = new Date().getFullYear();
    if (isNaN(targetYear)) {
      return res.status(400).json({ msg: 'Invalid year format provided.' });
    }
    const chartData = await getMonthlyChartData(targetYear);
    res.status(200).json(chartData);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



//home page
app.use(express.static(path.join(__dirname, "public")));
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sender.html"));
});

const PORT = process.env.PORT || 2300;
server.listen(PORT, () => {
  console.log(`server is up at ${PORT}`);
});
