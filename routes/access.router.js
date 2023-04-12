const express = require("express");
const createError = require("http-errors");
const request = require('request')
const User = require("../models/user.model");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../helpers/jwt_services");

const router = express.Router();

// #Sign up
router.get('/signup',(req,res,next)=>{
  res.render('access_signup',{
    pageTitle:'Sign up'
  })
})
router.post("/signup", async (req, res, next) => {
  console.log('signup')

  try {
    const { email, password ,full_name} = req.body;

    //      exists
    const user = await User.findOne({ email });

    if (user) {
      throw createError.Conflict();
    }

    //      create new USER
    const newUser = new User({
      email,
      password,
      full_name
    });

    await newUser.save();

    return res.redirect('/access/login');
  } catch (error) {
    next(error);
  }
});

// #login
router.get('/login',(req,res,next)=>{
  res.render('access_login',{
    pageTitle:"Log in"
  })
})
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //      exists
    const user = await User.findOne({ email });
    if (!user) {
      throw createError.NotFound();
    }

    //      compare password
    const isValid = await user.isCorrectPassword(password);

    if (!isValid) {
      throw createError.Unauthorized();
    }

    const accessToken = await signAccessToken(user._id);

    request.get(
      "http://localhost:3000/users/list/1",
      {
        headers: { Authorization: "JWT " + accessToken },
      },
      function (error, response, body) {
        res.send(body);
      }
    );

    // return res.json({
    //   status: "okay",
    //   element: user,
    //   accessToken,
    // })

    // return res.redirect('/users/list/1')
  } catch (error) {
    next(error);
  }
});

// #logout
router.post("/logout", (req, res, next) => {
  res.send("logout");
});

module.exports = router;
