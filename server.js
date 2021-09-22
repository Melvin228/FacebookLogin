const express = require("express");
const passport = require("passport");
const app = express();
const db = require("./models");
const morgan = require("morgan");
require("dotenv").config();

const jwt = require("jsonwebtoken");

const JWTAuth = passport.authenticate("jwt", { session: false });

//Sequelize
const { sequelize, User } = require("./models");

//middleware
app.use(express.json());
app.use(passport.initialize());
app.use(morgan("tiny"));

//Player routes
const Player = require("./routes/player");
app.use("/rest/api/player", Player);

app.use(express.urlencoded({ extended: true }));

//db
app.db = db;

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("Signup");
});

app.post("/userSignup", async (req, res) => {
  console.log(req.body);
  const { name, email } = req.body;

  const user = await User.findOne({ where: { name, email } });

  if (user) {
    return res.status(200).json({ message: "User already exist" });
  }

  const newUser = User.build({
    name,
    email,
  });

  if (newUser) {
    await newUser.save();
    res.status(200).json({ success: true, user: newUser });

    res.send("Proceed to login <a href='/'>Login</a>");
  } else {
    res.status(404), json({ error: true, message: "Please check the code" });
  }
});

app.post("/validateUser", async (req, res) => {
  console.log("The user is ", req.user);
  const { name, email } = req.body;

  const user = await User.findOne({ where: { name, email } });

  try {
    if (user) {
      const token = jwt.sign(
        {
          name: name,
          email: email,
          exp: Math.floor(Date.now() / 1000 + 60 * 60),
        },
        process.env.JwtSECRET
      );

      jwt.verify(token, process.env.JwtSECRET, (err, payload) => {
        console.log(payload);
        console.log(payload.name);
      });

      // res.send(
      //   "You have been validated <a href='protectedRoute'> Go to the protected route</a>"
      // );

      res.status(200).json({
        success: true,
        token: token,
        message: "Try the protected route at <a href='/protectedRoute'></a>",
      });
    }
  } catch (err) {
    res.status(404).json({ error: true, message: "Please try again", err });
  }

  //  else {
  //   res.send("Wrong user or password <a href='/'>Back to login</a>");
  // }
});

const port = process.env.PORT || 8180;

app.listen(port, async () => {
  await sequelize.authenticate();
  console.log(`Server is listening on port ${port}`);
});
