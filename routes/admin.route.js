const app = require("express").Router();
const { response } = require("express");
const Course = require("../models/course.model");

app.post("/create", async (req, res) => {
  const course = new Course(req.body);
  const response = Course.findOne({ courseCode: course.courseCode })
  // if (response) {
  //   console.log(response);
  //   return res.status(412).send("Course already exists");
  // }
  course.save().then((result) => {
    if (!result) {
      return res.send(200);
    }
    return res.status(400);
  });
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

module.exports = app;
