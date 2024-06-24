const app = require("express").Router();


app.post("/create", async (req, res) => {
    const course = new Course({
      courseCode: "CSE101",
      courseName: "Introduction to Computer Science",
      offeringDepartment: "CS",
      seatsAvailable: 60,
      accessibleBy: ["CS", "admin"],
    });
  
    try {
      const savedCourse = await course.save();
      res.send(savedCourse);
    } catch (err) {
      res.status(400).send(err);
    }
  });
  

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});