const app = require("express").Router();
const Course = require("../models/course.model");
app.post("/select", async (req, res) => {
  const courseId = req.body.courseId;
  console.log('courseId', courseId);
  Course.findOneAndUpdate(
    { courseCode: courseId, seatsAvailable: { $gt: 0 } },
    { $inc: { seatsAvailable: -1 } },
    { returnDocument: 'after' }
  ).then((result) => {
    console.log('result', result);
    if (!result) {
      return res.send(400);
    }
    return res.send(200);
  });
});

module.exports = app;