const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
require("dotenv").config();
const jwt = require("jsonwebtoken");

//Load user model
const { sequelize, User } = require("../models");

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.CLIENT_ID_FB,
      clientSecret: process.env.CLIENT_SECRET_FB,
      callbackURL:
        "http://localhost:8180/rest/api/player/auth/facebook/callback",
      // passReqToCallback: true,
      profileFields: ["id", "displayName", "name", "gender", "email"],
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
        console.log(accessToken);
        let email = profile.emails[0].value;
        let facebookId = profile.id;
        let name = `${profile.name.givenName} ${profile.name.familyName}`;

        //Step1  : Authenticate the user
        try {
          const player = await User.findOne({
            where: {
              email,
              name,
            },
          });

          //Step 2: find if the user exist in the database: (Without facebook)
          if (player) {
            console.log("The player might exist ", player);
            const fbId = await User.findOne({
              where: { id: player.dataValues.id, facebookId },
            });

            //Step 3: If user exist in the database without facebook, check if he has facebook
            //If he does, proceed to sign the jwt token and provide access to protected route
            if (fbId) {
              console.log("Facebook verification");
              const token = jwt.sign(
                {
                  name: player.dataValues.name,
                  email: player.dataValues.email,
                  facebookId: player.dataValues.facebookId,
                  exp: Math.floor(Date.now() / 1000 + 60 * 60),
                },
                process.env.JwtSECRET
              );

              console.log(token);

              return done(null, player, accessToken, token);

              //Step 4 : If the does not have a faceboo1kId, proceed to update the database with the facebookId,
              //in the live server, might need to generate random password for the user.
              // then sign the jwt token with the relevant payload.
            } else {
              //Updating the user database

              console.log("Updating the user");
              let token = "";
              const userWithFbId = await User.update(
                { facebookId },
                {
                  where: { id: player.dataValues.id },
                  returning: true,
                  plain: true,
                }
              ).then((result) => {
                token = jwt.sign(
                  {
                    name: result[1].dataValues.name,
                    email: result[1].dataValues.email,
                    facebookId: result[1].dataValues.facebookId,
                    exp: Math.floor(Date.now() / 1000 + 60 * 60),
                  },
                  process.env.JwtSECRET
                );
                console.log(result[1]);
                return done(null, result[1], accessToken);
              });
              console.log(token);
            }

            //Step 5: if email does not match, but user have a facebookId recorded in the database.
            //Step 6 : If the user email , and name does not exist at all, indicating new user , then proceed to create new user.
            //Sign in the jwt token
          } else {
            console.log(
              "Checking to see if the facebookId exist and the email does not exist"
            );
            const fbId = await User.findOne({
              where: { facebookId },
            });

            if (fbId) {
              const token = jwt.sign(
                {
                  name: fbId.dataValues.name,
                  email: fbId.dataValues.email,
                  facebookId: fbId.dataValues.facebookId,
                  exp: Math.floor(Date.now() / 1000 + 60 * 60),
                },
                process.env.JwtSECRET
              );
              return done(null, fbId, accessToken);
            } else {
              //creating a new user if user does not exist
              console.log("creating new user", profile);
              var newUser = User.create({
                email,
                facebookId,
                name,
              });

              console.log(newUser);

              const token = jwt.sign(
                {
                  name: name,
                  email: email,
                  exp: Math.floor(Date.now() / 1000 + 60 * 60),
                },
                process.env.JwtSECRET
              );

              return done(null, newUser, token);
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
