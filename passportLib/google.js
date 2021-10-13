const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

const { sequelize, User } = require("../models");

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID_GOOGLE,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE,
      callbackURL: "http://localhost:5500/rest/api/player/auth/google/callback",
      // profileFields: ["id", "displayName", "name", "gender", "email"],
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
        console.log("This is the profile details", profile);
        console.log(profile.gender);
        let email = profile.emails[0].value;
        let googleId = profile.id;
        let name = profile.displayName;
        console.log(email, googleId, name);

        //Step1  : Authenticate the user
        try {
          const player = await User.findOne({
            where: {
              email,
              name,
            },
          });

          // Step 2: find if the user exist in the database: (Without google)
          if (player) {
            console.log("The player data is here", player);
            let userWithGoogleId = await User.findOne({
              where: {
                googleId,
                email: player.dataValues.email,
              },
            });

            //Step 3: If user exist in the database without facebook, check if he has facebook
            //If he does, proceed to sign the jwt token and provide access to protected route
            if (userWithGoogleId) {
              console.log("Google verification");

              // console.log(token);

              return done(null, userWithGoogleId);

              //       //Step 4 : If the does not have a faceboo1kId, proceed to update the database with the facebookId,
              //       //in the live server, might need to generate random password for the user.
              //       // then sign the jwt token with the relevant payload.
            } else {
              //Updating the user database

              console.log("Updating the user");

              const userWithGoogleId = await User.update(
                { googleId },
                {
                  where: { id: player.dataValues.id },
                  returning: true,
                  plain: true,
                }
              );
              return done(null, userWithGoogleId);
            }

            //Step 5: if email does not match, but user have a facebookId recorded in the database.
            //Step 6 : If the user email , and name does not exist at all, indicating new user , then proceed to create new user.
            //Sign in the jwt token
          } else {
            console.log(
              "Checking to see if the googleId exist and the email does not exist"
            );
            let userWithoutEmail = await User.findOne({
              where: { googleId: googleId },
            });

            if (userWithoutEmail) {
              return done(null, googleId, accessToken);
            } else {
              //creating a new user if user does not exist
              console.log("creating new user", profile);
              var newUser = User.create({
                email,
                googleId,
                name,
              });

              console.log(newUser);
              return done(null, newUser, accessToken);
            }
          }
        } catch (err) {
          console.log(err);
          return done(err, false);
        }
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  console.log("passport serialize being called");
  done(null, user);
});

passport.deserializeUser(function (id, done) {
  console.log("passport deserialize being called");
  User.findOne({ where: { id } }, function (err, user) {
    done(null, user);
  });
});
