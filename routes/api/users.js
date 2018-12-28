const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys").secretKey;
const passport = require("passport");

//Load Input Validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

//Get User mongoose schema
const User = require("../../models/User");

// Test User Route
router.get("/test", (req, res) => {
  res.json({
    msg: "Users INfo"
  });
});

//Register User
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(404).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email Already Exits";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //Size,
        r: "pg", //Rating
        d: "mm" //Default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar: avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, 10, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

//Login User
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }).then(user => {
    if (!user) {
      errors.email = "User Not Found";
      return res.status(404).json(errors);
    }

    //Check Password,
    //From body we are getting password as plain text,
    //We need to used bcrypt compare method to compre the password
    bcrypt.compare(password, user.password).then(checkMatch => {
      if (checkMatch) {
        //User Matched
        //jwt.sign(payload, secretOrPrivateKey, [options, callback]) --> How JWT Work
        const payload = { id: user.id, name: user.name, avatar: user.avatar };
        jwt.sign(payload, keys, { expiresIn: 3600 }, (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token
          });
        });
        //Sign Token
      } else {
        errors.password = "Password Incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

//Currect User Authentication -- Protected

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
