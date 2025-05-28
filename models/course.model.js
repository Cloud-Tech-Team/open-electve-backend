const mongoose = require("mongoose");
const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    lowercase: true,
    required: true,
  },
  courseName: {
    type: String,
    lowercase: true,
    required: true,
  },
  offeringDepartment: {
    type: String,
    lowercase: true,
    required: true,
  },
  seatsAvailable: {
    type: Number,
    default: 60,
    required: true,
  },
  accessibleBy: [
    {
      type: String,
      lowercase: true,
      required: true,
    },
  ],
  enrolledStudents: [
    {
      type: String,
      lowercase: true,
    },
  ],
});

const Course = mongoose.model("course", courseSchema);
module.exports = Course;
