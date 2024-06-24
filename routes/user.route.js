const app = require("express").Router();
const e = require("express");
const User = require("../models/user.model");

const emailRegex = /^\d\d\w\w\d\d\d@mgits\.ac\.in$/;

// 21 CS 051 @mgits.ac.in

async function userReg(email, registerId, res) {
  if (!emailRegex.test(email)) {
    res.status(400).send("Invalid email");
    return;
  }
  const user = new User({
    email: email,
    registerId: registerId,
    department: email.substring(2, 4),
    optedCourse: null,
  });
  try {
    const savedUser = await user.save();
    res.send(savedUser);
    return;
  } catch (err) {
    res.status(400).send(err);
    return;
  }
}

app.post("/register", async (req, res) => {
  console.log(req.body);
  try {
    const email = req.body.email;
    const registerId = req.body.registerId;
    console.log(email, registerId);
    await userReg(email, registerId, res);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

module.exports = app;
