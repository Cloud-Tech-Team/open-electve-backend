const app = require("express").Router();
const Course = require("../models/course.model");
const User = require("../models/user.model");

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
      return res.sendStatus(412);
    } else {
      User.findOneAndUpdate(
        {
          email: req.body.email,
        },
        { optedCourse: courseId }
      ).then((result) => {
        console.log("result", result);
        if (!result) {
          return res.sendStatus(412);
        }
        return res.sendStatus(200);
      });
    }
  });
}); 

app.post("/allcourses", async (req, res) => {
  console.log("Department: ", req.body);
  Course.find({ accessibleBy: req.body.department }).then((result) => {
    if (!result) {
      return res.sendStatus(400);
    }
    console.log(result);
    const response = result.map((course) => {
      return {
        courseId: course.courseCode,
        courseName: course.courseName,
        seatsAvailable: course.seatsAvailable,
      };
    });
    return res.send(response);
  });
});

module.exports = app;
