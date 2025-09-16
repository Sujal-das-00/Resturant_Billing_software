const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io')
const db = require('./db')
const person = require('./models/person');
const bodyParser = require('body-parser');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});


app.use(express.static("public"));//serve html file
app.use(bodyParser.json());


//creating connection as well as listening for a particular data here order 
io.on('connection', (socket) => {
    console.log("Socket created sucesssfully");
    socket.on("order", (data) => {
        console.log("Order received from client:", data);
        // io.emit to all clients inc sender but socet.brodcast all except sender
        socket.broadcast.emit("order", data);
    });
});
io.on('connection',(socket)=>{
    console.log("2nd socket created sucessfully");
    socket.on('parcel',(data)=>{
        console.log("parcel send sucessfully",data);
        socket.broadcast.emit('parcel',data)
    })
})




//home page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/sender.html");
});

app.get('/get', async (req, res) => {
    const get = await person.find();
    res.send(get);
})
//check if payment done
app.get('/api/customer/:token', async (req, res) => {
    const token = req.params.token;
    const data = await person.findOne({ tempToken: token });
    res.json({ Payment_status: data.status });
});



//check if table exixst
app.get('/api/customer/table/:table', async (req, res) => {
    const tableNo = Number(req.params.table)
    const data = await person.findOne({ Table_no: tableNo });
    if (!data) {
        return res.json({ status: "notBooked" })
    }
    res.json({ status: data.table_status });
});


app.post('/api/bookingstatus', (req, res) => {
    const data = req.body;

})

app.post('/api/orders', async (req, res) => {
    try {

        const data = req.body;
        const newOrder = new person(data);
        const response = await newOrder.save();
        console.log("data is saved");

        //io.emit will broadcast the data to all the clients
        io.emit("orders", newOrder);
        console.log("data send to client dashboard ");
        res.status(200).json(response);
    }
    catch (err) {
        console.log("Error");
        res.status(500).json({ message: 'Internal error occured', error: err.message })
    }

})






server.listen(5000, () => { console.log("server is up at 5000") });