const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World up");
});

// app.use("/user", require("./routes/user.route"));

mongoose
  .connect(
    "mongodb+srv://akshhaykmurali:<password>@backenddb.mx3mklp.mongodb.net/Node-API?retryWrites=true&w=majority&appName=BackendDB"
  )
  .then(() => {
    console.log("connected to db!");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch(() => {
    console.log("connection failed");
  });
