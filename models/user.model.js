const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  registerId: {
    type: String,
    required: true,
    lowercase: true,
  },
  department: {
    type: String,
    default: null,
    lowercase: true,
  },
  optedCourse: {
    type: String,
    default: null,
    lowercase: true,
  },
});

const User = mongoose.model("user", UserSchema);
module.exports = User;
