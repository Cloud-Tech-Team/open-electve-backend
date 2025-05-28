const express = require("express");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ✅ Middleware
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(express.json());

// ✅ Inject io into every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Routes
app.get("/", (req, res) => {
  res.send("Hello World up");
});

app.use("/courses", require("./routes/course.route"));
app.use("/admin", require("./routes/admin.route"));
app.use("/", require("./routes/user.route.js"));

// ✅ WebSocket Events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinCourse", (courseCode) => {
    socket.join(courseCode);
    console.log(`User ${socket.id} joined course ${courseCode}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

// ✅ Start Server after DB connection
mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("Connected to MongoDB!");
    httpServer.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error(err);
  });
