const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
//Profile Model
const Profile = require("../../models/Profile");
//User Model
const User = require("../../models/User");
//Validation Profile
const validateProfileInput = require("../../validation/profile");
//Validate Expeirence
const validateExperienceInput = require("../../validation/experience");
//Validate Education
const validateEducationInput = require("../../validation/education");

//test
router.get("/test", (req, res) => {
  res.json({
    msg: "Profile INfo"
  });
});

//Get Current User Profile
//we will get this by payload in token ---> The User Information which we store in jwt payload by their token
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    //check profile
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "Their is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

//To Get All The profile /all

router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .then(profiles => {
      if (!profiles || profiles.length === 0) {
        errors.noprofile = "There are no profiles availabel";
        res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

//Get The profile by handle like /handle/:handle ==> /handle/data --
//It will gives us the profile by handle
router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })

    .catch(err => res.status(404).json(err));
});

//Get The profile by user_id like /users/:user_id
router.get("/users/:user_id", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    //If not found then mongodb generate its own error which is not suitable for this
    //so change that to no profile for user
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

//Create Profile of User or Edit the Profile
//It also require the passport authentication-- to check the validation of user
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    //Check Validation
    const { errors, isValid } = validateProfileInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    //All The Fields
    const profileFields = {};
    profileFields.user = req.user.id; //It is coming from passport jwt payload
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;

    //Skills --> we are getting comma seperated values , so we are putting in array
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }

    //Social stuff
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        //To Update the Profile
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        //To Create the Profile if, the profile is undefined
        //Check if handle exist
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = "That handle already exits";
            res.status(400).json(errorz);
          }
          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

//Experience Post request /experience
//To Add the experience we have specified the new route
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);
    //check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        const newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
          //Simply can do that {...req.body} destruction --->
        };
        profile.experience.unshift(newExp);
        profile.save().then(profile => res.json(profile));
      } else {
        res.status(404).json("First Create The Profile");
      }
    });
  }
);

//Experience Post request /education
//To Add the eduction we have specified the new route
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
    //check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        const newEdu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
          //Simply can do that {...req.body} destruction --->
        };
        profile.education.unshift(newEdu);
        profile.save().then(profile => res.json(profile));
      } else {
        res.status(404).json("First Create The Profile");
      }
    });
  }
);

//Delete experience /experience/:exp_id
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        //Remove Index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);
        if (removeIndex !== -1) {
          profile.experience.splice(removeIndex, 1);
          profile.save().then(profile => res.status(200).json(profile));
        } else {
          res.status(404).json({ exp: "There is no experience to delete" });
        }
      })
      .catch(err => res.status(404).json(err));
  }
);

//Delete experience /experience/:exp_id
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        //Remove Index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);
        if (removeIndex !== -1) {
          profile.education.splice(removeIndex, 1);
          profile.save().then(profile => res.status(200).json(profile));
        } else {
          res.status(404).json({ exp: "There is no education to delete" });
        }
      })
      .catch(err => res.status(404).json(err));
  }
);

//To Delete the Whole User and Profile
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() => {
        res.json({ success: true });
      });
    });
  }
);

module.exports = router;
