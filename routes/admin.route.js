const app = require("express").Router();
const express = require("express");
const Course = require("../models/course.model");

app.post("/create", async (req, res) => {
  if (req.headers.authorization !== process.env.SECRETKEY) {
    return res.status(401).send("Unauthorized");
  }
  const course = new Course(req.body);
  try {
    const existingCourse = await Course.findOne({
      courseCode: course.courseCode,
    });
    if (existingCourse) {
      return res.status(412).send("Course already exists");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
  course.save().then(async (result) => {
    if (result) {
      return res.sendStatus(200);
    }
    return res.status(400);
  });
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

module.exports = app;
