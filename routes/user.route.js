const app = require("express").Router();
const User = require("../models/user.model");

app.post("/register", async (req, res) => {
  console.log(req.body);
  try {
    const { name, email, registerId } = req.body;
    console.log(email, registerId);
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      res.sendStatus(412); // Precondition Failed - user already exists
      return;
    }
    await userReg(name, email, registerId, res);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

async function userReg(name, email, registerId, res) {
  const user = new User({
    name: name,
    email: email,
    registerId: registerId,
    department: email.substring(2, 4),
    optedCourse: null,
  });
  try {
    const savedUser = await user.save();
    res.status(200).send(savedUser); // Correctly send a 200 status and the saved user object
  } catch (err) {
    res.status(400).send(err);
  }
}

module.exports = app;
