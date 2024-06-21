const mongoose = require("mongoose");
const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    lowercase: true,
  },
  courseName: {
    type: String,
    lowercase: true,
  },
  offeringDepartment: {
    type: String,
    lowercase: true,
  },
  seatsAvailable: {
    type: Number,
    default: 60,
  },
  accessibleBy: [
    {
      type: String,
      lowercase: true,
    },
  ],
});

const Course = mongoose.model("course", courseSchema);
module.exports = Course;
