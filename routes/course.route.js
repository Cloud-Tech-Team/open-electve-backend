const app = require("express").Router();
const Course = require("../models/course.model");




app.post("/select", async (req, res) => {
  const courseId = req.body.courseId;
  console.log("courseId", courseId);
  Course.findOneAndUpdate(
    { courseCode: courseId, seatsAvailable: { $gt: 0 } },
    { $inc: { seatsAvailable: -1 } },
    { returnDocument: "after" }
  ).then((result) => {
    console.log("result", result);
    if (!result) {
      return res.send(400);
    }
    return res.send(200);
  });
});



app.post("/allcourses", async (req, res) => {
  console.log("Department: ",req.body)
  Course.find({accessibleBy: req.body.department}).then((result) => {
    if (!result) {
      return res.send(400);
    }
    console.log(result)
    const response = result.map(course => {
      return {
        courseId: course.courseCode,
        courseName: course.courseName,
        seatsAvailable: course.seatsAvailable,
      }
    })
    return res.send(response);
  });
});

module.exports = app;
