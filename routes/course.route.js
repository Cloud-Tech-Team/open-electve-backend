const express = require("express");
const Course = require("../models/course.model");
const User = require("../models/user.model");
const logger = require("../utils/logger");

const app = express.Router();

// POST /courses/select
app.post("/select", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const { courseId, email } = req.body;
  
  logger.request('POST', '/courses/select', clientIP);
  logger.info(`Course selection attempt - Email: ${email}, Course: ${courseId}`);

  try {
    // Decrease seat count and add student to enrolled list
    logger.debug(`Attempting to register ${email} for course ${courseId}`);
    logger.database('UPDATE', 'courses', `Decrementing seats for ${courseId}`);
    
    const course = await Course.findOneAndUpdate(
      { courseCode: courseId, seatsAvailable: { $gt: 0 } },
      { $inc: { seatsAvailable: -1 }, $push: { enrolledStudents: email } },
      { returnDocument: "after" }
    );

    if (!course) {
      logger.warn(`Course selection failed - No seats available or course not found: ${courseId}`);
      logger.request('POST', '/courses/select', clientIP, 412);
      return res.status(412).send("No seats available or course not found");
    }

    logger.success(`Course updated successfully - ${courseId} now has ${course.seatsAvailable} seats`);

    // Update user's opted course
    logger.database('UPDATE', 'users', `Setting opted course for ${email}`);
    const user = await User.findOneAndUpdate(
      { email },
      { optedCourse: courseId },
      { new: true }
    );

    if (!user) {
      logger.error(`User not found during course selection: ${email}`);
      logger.warn('Rolling back course seat decrement due to user not found');
      
      // Rollback seat decrement if user not found
      await Course.findOneAndUpdate(
        { courseCode: courseId },
        { $inc: { seatsAvailable: 1 }, $pull: { enrolledStudents: email } }
      );
      
      logger.database('UPDATE', 'courses', `Rollback completed for ${courseId}`);
      logger.request('POST', '/courses/select', clientIP, 412);
      return res.status(412).send("User not found");
    }

    logger.success(`${email} successfully registered for ${courseId}`);
    logger.database('UPDATE', 'users', `User ${email} opted for ${courseId}`);

    // ✅ Emit update to Socket.IO room
    req.io.to(courseId).emit("courseUpdated", {
      courseId: course.courseCode,
      seatsAvailable: course.seatsAvailable,
    });
    logger.info(`Socket.IO update sent for course ${courseId} - ${course.seatsAvailable} seats remaining`);

    logger.request('POST', '/courses/select', clientIP, 200);
    return res.status(200).json({ seatsAvailable: course.seatsAvailable });
  } catch (error) {
    logger.error("Error in course selection:", error);
    logger.request('POST', '/courses/select', clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

// POST /courses/allcourses
app.post("/allcourses", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const { department } = req.body;
  
  logger.request('POST', '/courses/allcourses', clientIP);
  logger.info(`Fetching courses for department: ${department}`);

  try {
    logger.database('READ', 'courses', `Finding courses accessible by ${department.toLowerCase()}`);
    const courses = await Course.find({
      accessibleBy: department.toLowerCase(),
    });

    if (!courses || courses.length === 0) {
      logger.warn(`No courses found for department: ${department}`);
      logger.request('POST', '/courses/allcourses', clientIP, 404);
      return res.status(404).json([]);
    }

    const response = courses.map((course) => ({
      courseId: course.courseCode,
      courseName: course.courseName,
      seatsAvailable: course.seatsAvailable,
    }));

    logger.success(`Found ${courses.length} courses for department ${department}`);
    logger.debug('Courses found:', response);
    logger.request('POST', '/courses/allcourses', clientIP, 200);
    return res.json(response);
  } catch (error) {
    logger.error("Error in fetching courses:", error);
    logger.request('POST', '/courses/allcourses', clientIP, 500);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
