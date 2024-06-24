const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
dotenv.config();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World up");
});

// app.get("/courses", require("./routes/course.route.js"));

app.use("/", require("./routes/user.route.js"));

mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("connected to db!");

    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
