const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const User = require("../models/User").User;

const { sequelize } = require("../models/User");

require("dotenv").config();

const opt = {};

opt.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opt.secretOrKey = process.env.JwtSECRET;

module.exports = (db, passport) => {
  passport.use(
    "user-jwt",
    new JWTStrategy(opt, async function (jwt_payload, done) {
      try {
        const user = await db.User.findOne({
          where: { name: jwt_payload.name },
        });
        if (user) {
          return done(null, user);
        }
        done(null, false, { message: "User not found" });
      } catch (err) {
        console.log(err);
        done(err);
      }
    })
  );
};

// passport.serializeUser(function (user, done) {
//   console.log("passport serialize being called");
//   done(null, user.name);
// });

// passport.deserializeUser(async function (name, done) {
//   console.log("passport deserialize being called");
//   await User.findOne({ where: { name } }, function (err, user) {
//     done(null, user);
//   });
// });
