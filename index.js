const express = require("express");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const Course = require("./models/course.model");
const logger = require("./utils/logger");

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
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

// Helper function to broadcast course count updates
const broadcastCourseCount = async () => {
  try {
    const totalCourses = await Course.countDocuments();
    io.emit('courseCountUpdate', { totalCourses });
    logger.debug(`Broadcasting course count update: ${totalCourses} courses`);
  } catch (error) {
    logger.error('Error broadcasting course count:', error);
  }
};

// Helper function to broadcast detailed course statistics
const broadcastCourseStatistics = async () => {
  try {
    const courses = await Course.find({});
    const courseStats = courses.map(course => ({
      courseCode: course.courseCode,
      seatsAvailable: course.seatsAvailable,
      enrolledCount: course.enrolledStudents.length,
      totalCapacity: course.seatsAvailable + course.enrolledStudents.length,
      enrollmentPercentage: ((course.enrolledStudents.length / (course.seatsAvailable + course.enrolledStudents.length)) * 100).toFixed(1)
    }));
    
    io.emit('courseStatisticsUpdate', { courses: courseStats });
    logger.debug(`Broadcasting course statistics update for ${courseStats.length} courses`);
  } catch (error) {
    logger.error('Error broadcasting course statistics:', error);
  }
};

// Make broadcastCourseCount and broadcastCourseStatistics available to routes
app.use((req, res, next) => {
  req.broadcastCourseCount = broadcastCourseCount;
  req.broadcastCourseStatistics = broadcastCourseStatistics;
  next();
});

// ✅ Routes

app.use("/courses", require("./routes/course.route"));
app.use("/admin", require("./routes/admin.route"));
app.use("/", require("./routes/allowed.route"));
app.use("/", require("./routes/user.route.js"));

// ✅ WebSocket Events
io.on("connection", (socket) => {
  const clientIP = socket.handshake.address;
  logger.info(`WebSocket connection established: ${socket.id} from ${clientIP}`);

  socket.on("joinCourse", (courseCode) => {
    socket.join(courseCode);
    logger.info(`User ${socket.id} joined course room: ${courseCode}`);
  });
  socket.on("requestCourseCount", async () => {
    try {
      const totalCourses = await Course.countDocuments();
      logger.debug(`Course count requested by ${socket.id}: ${totalCourses} courses`);
      socket.emit('courseCountUpdate', { totalCourses });
    } catch (error) {
      logger.error('Error fetching course count for WebSocket:', error);
      socket.emit('courseCountUpdate', { totalCourses: 0 });
    }
  });

  socket.on("requestCourseStatistics", async () => {
    try {
      const courses = await Course.find({});
      const courseStats = courses.map(course => ({
        courseCode: course.courseCode,
        seatsAvailable: course.seatsAvailable,
        enrolledCount: course.enrolledStudents.length,
        totalCapacity: course.seatsAvailable + course.enrolledStudents.length,
        enrollmentPercentage: ((course.enrolledStudents.length / (course.seatsAvailable + course.enrolledStudents.length)) * 100).toFixed(1)
      }));
      
      logger.debug(`Course statistics requested by ${socket.id}: ${courseStats.length} courses`);
      socket.emit('courseStatisticsUpdate', { courses: courseStats });
    } catch (error) {
      logger.error('Error fetching course statistics for WebSocket:', error);
      socket.emit('courseStatisticsUpdate', { courses: [] });
    }
  });

  socket.on("disconnect", () => {
    logger.info(`WebSocket user disconnected: ${socket.id}`);
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
