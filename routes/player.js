const express = require("express");
const Router = express.Router();
const passport = require("passport");
const db = require("../models");
require("dotenv").config();

const FBAuth = passport.authenticate("facebook", {
  scope: "email",
});

const GoogleOAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});
const JWTAuth = passport.authenticate("user-jwt", { session: false });

const { sequelize, User } = require("../models");
const jwt = require("jsonwebtoken");

require("../passportLib/google.js");
require("../passportLib/facebook.js");
require("../passportLib/jwt")(db, passport);
require("dotenv").config();
/*
  Route: /rest/api/player/auth/facebook/
  Description:API TO CALL TO FACEBOOK
*/

Router.get("/auth/facebook", FBAuth);

/*
  Route: /rest/api/player/auth/facebook/callback
  Description:Callback for facebook
*/
Router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to the success page.
    res.redirect("/rest/api/player/success");
  },
  FBAuth
);

/*
  Route: /rest/api/player/auth/google
  Description:Call to google route
*/
Router.get("/auth/google", GoogleOAuth);

/*
  Route: /rest/api/player/auth/google/callback
  Description:Callback from google
*/
Router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to the success page.
    console.log(req.user);
    const token = jwt.sign(
      {
        email: req.user.email,
        googleId: req.user.googleId,
        exp: Math.floor(Date.now() / 1000 + 60 * 60),
      },
      process.env.JwtSECRET
    );
    res.json({ success: true, token: token });
    // res.redirect("/rest/api/player/success");
  }
);

/*
  Route: /rest/api/player/login
  Description:Success callback after the facebook login
*/
Router.get("/success", verifyToken, async (req, res) => {
  // console.log(req.headers);
  jwt.verify(req.token, process.env.JwtSECRET, (err, authData) => {
    if (err) {
      console.log(err);
      res.sendStatus(403);
    } else {
      res.json({
        message: "Welcome to Profile",
        userData: authData,
      });
    }
  });
  // console.log("ERROR OCCURED HERE");
  // console.log(req.user);
  // console.log(req.body);
  // const { name, email } = req.body;

  // try {
  //   const existingPlayer = await User.findOne({ where: { name, email } });

  //   if (existingPlayer) {
  //     return res.send("You have been authenticated");
  //   } else {
  //     existingPlayer.save().then((response) => {
  //       console.log(response);
  //       return res
  //         .status(200)
  //         .json({ success: true, message: "You have been authenticated" });
  //     });
  //   }
  // } catch (err) {
  //   console.log(err);

  // }

  // res.send("Made it to the success route");
});

Router.get("/", (req, res) => {
  res.send(
    "Hello world, Click here to login <a href='/rest/api/player/auth/facebook'>Login to facebook </a>"
  );
});

/*
  Route: /rest/api/player/user
  Description:find one user
*/
Router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ where: { id } });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: true, message: err });
  }
});

/*
  Route: /rest/api/player/user
  Description:find all user
*/
Router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: true, message: err });
  }
});

/*
  Route: /rest/api/player/protected
  Description:Protected Route accessed using passport jwt
*/
Router.get("/protected", JWTAuth, (req, res) => {
  res.send("This is a protectedRoute");
});

Router.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await User.create({ name, email });

    return res.json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err, message: "Failed to create the database table" });
  }
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    console.log(bearer);
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

module.exports = Router;
