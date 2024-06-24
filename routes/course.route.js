// Assuming you have a courseId and want to decrease seatsAvailable by 1
const courseId = "someCourseId";
const Course = require("../models/course.model");
const mongoose = require("mongoose");


Course.aggregate([
  {
    $match: {
      _id: mongoose.Types.ObjectId(courseId) // Match the course by ID
    }
  },
  {
    $addFields: {
      seatsAvailable: {
        $cond: {
          if: { $gt: ["$seatsAvailable", 0] }, // Check if seatsAvailable is greater than 0
          then: { $subtract: ["$seatsAvailable", 1] }, // Decrease seatsAvailable by 1
          else: "$seatsAvailable" // Leave seatsAvailable unchanged if it's 0 or less
        }
      }
    }
  },
  {
    $merge: {
      into: "courses", // Merge the results back into the courses collection
      on: "_id", // Merge on the _id field
      whenMatched: "replace" // Replace the document in the collection with the aggregation result
    }
  }
]).then(result => {
  console.log("Aggregation executed", result);
}).catch(err => {
  console.error("Error executing aggregation", err);
});