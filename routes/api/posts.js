const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Post Model
const Post = require("../../models/Post");
//Profile Model
const Profile = require("../../models/Profile");

//Validating
const validatePostInput = require("../../validation/post");

router.get("/test", (req, res) => {
  res.json({
    msg: "Posts INfo"
  });
});

//To Get All posts
router.get("/", (req, res) => {
  Post.find()
    .sort({ data: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: "No Posts Found" }));
});

//To Get posts by id
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ nopostsfound: "No Post Found" }));
});

//Creating the Post =>  /posts
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

//Delete the post /:id
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //Validate the post id from database and incoming paramater
          if (post.user.toString() != req.user.id) {
            return res.status(401).json({ noAuthorised: "User Not Found" });
          }

          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
    });
  }
);

// To Upvote like like/:id
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyLiked: "User Already liked this posts" });
          }
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
    });
  }
);

// To Dislike  [unlike/:id]
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notLiked: "You hadn't like this post yet" });
          }

          //Get the index of remove item
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);
          //Remove the value
          post.likes.splice(removeIndex, 1);
          //save
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
    });
  }
);

//Post Add-Comment comment/:id
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        //Adding comment
        post.comments.unshift(newComment);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
  }
);

//Delete comments comment/post_id/comment_id
//Remove the comment from post
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //Check comment is their or not
        if (
          post.comments.filter(
            comments => comments._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexits: "Comment Does Not Exits" });
        }

        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        post.comments.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
  }
);

module.exports = router;
