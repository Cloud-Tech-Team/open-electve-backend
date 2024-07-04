const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
dotenv.config();

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World up");
});

app.use("/courses", require("./routes/course.route"));

app.use("/admin", require("./routes/admin.route"));

app.use("/", require("./routes/user.route.js"));

mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("Connected to MongoDB!");

    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error(err);
  });
