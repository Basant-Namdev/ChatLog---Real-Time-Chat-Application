const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const outRoutes = require('./routes/outRoutes');
const inRoutes = require('./routes/inRoutes');
const outController = require('./controller/outController');

const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const socket = require('./socketIO');
const cors = require('cors');
const cookieParser = require("cookie-parser");

const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: process.env.FRONTEND_URL, // frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

require('dotenv').config();
main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("database connected");
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/public', express.static("public"));

app.use('/', outRoutes.router);
app.use('/dashbord', outController.isAuth, inRoutes.router);

socket(io);

server.listen(process.env.PORT, () => {
  console.log("server started");
})