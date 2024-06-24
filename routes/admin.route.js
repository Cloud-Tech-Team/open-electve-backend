const app = require("express").Router();
const Course = require("../models/course.model");

app.post("/create", async (req, res) => {
  const course = new Course(req.body);
  if (Course.findOne({ courseCode: course.courseCode })) {
    return res.status(412).send("Course already exists");
  }
  await course.save().then((result) => {
    if (!result) {
      return res.send(200);
    }
    return res.status(400).send(err);
  });
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

module.exports = app;
