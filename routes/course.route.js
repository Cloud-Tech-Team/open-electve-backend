const express = require("express");
const Course = require("../models/course.model");
const User = require("../models/user.model");

const app = express.Router();

// POST /courses/select
app.post("/select", async (req, res) => {
  const { courseId, email } = req.body;
  console.log("Attempting to register:", email, "for course:", courseId);

  try {
    // Decrease seat count and add student to enrolled list
    const course = await Course.findOneAndUpdate(
      { courseCode: courseId, seatsAvailable: { $gt: 0 } },
      { $inc: { seatsAvailable: -1 }, $push: { enrolledStudents: email } },
      { returnDocument: "after" }
    );

    if (!course) {
      return res.status(412).send("No seats available or course not found");
    }

    // Update user's opted course
    const user = await User.findOneAndUpdate(
      { email },
      { optedCourse: courseId },
      { new: true }
    );

    if (!user) {
      // Rollback seat decrement if user not found
      await Course.findOneAndUpdate(
        { courseCode: courseId },
        { $inc: { seatsAvailable: 1 }, $pull: { enrolledStudents: email } }
      );
      return res.status(412).send("User not found");
    }

    console.log(`${email} successfully registered for ${courseId}`);

    // ✅ Emit update to Socket.IO room
    req.io.to(courseId).emit("courseUpdated", {
      courseId: course.courseCode,
      seatsAvailable: course.seatsAvailable,
    });

    // In /courses/select
    return res.status(200).json({ seatsAvailable: course.seatsAvailable });
  } catch (error) {
    console.error("Error in /select:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// POST /courses/allcourses
app.post("/allcourses", async (req, res) => {
  const { department } = req.body;
  console.log("Fetching courses for department:", department);

  try {
    const courses = await Course.find({
      accessibleBy: department.toLowerCase(),
    });

    if (!courses || courses.length === 0) {
      return res.status(404).json([]);
    }

    const response = courses.map((course) => ({
      courseId: course.courseCode,
      courseName: course.courseName,
      seatsAvailable: course.seatsAvailable,
    }));

    console.log("Courses found:", response);
    return res.json(response);
  } catch (error) {
    console.error("Error in /allcourses:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
