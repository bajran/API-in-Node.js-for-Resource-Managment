const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");
const passport = require("passport");

const app = express();
//Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Key Required for connection
const db = require("./config/keys").mongoURI;

//Connect Mongo
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("Database Connection Successfull :)"))
  .catch(err => console.log("Error", err));

//Passport Middleware
app.use(passport.initialize());

//Passport Strategy
require("./config/passport")(passport);

// Accordingly Use Routes
app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

//Port
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server Running -- Port no. ${port}`));
