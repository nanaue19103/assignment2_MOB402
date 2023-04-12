require("dotenv").config();
const express = require("express");
const User = require("../models/user.model");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../helpers/jwt_services");

const router = express.Router();

// 'page' is global variable (to handle back button to List)
var page = 1;

// #READ
router.get("/list/:page", async (req, res, next) => {
  console.log(`headers ___${req.headers}`);

  try {
    // _1-get all users
    const users = await User.find({}).lean().exec();

    // _2-get all pages
    const pages = [];
    const max = 10;
    const pageCount = Number.isInteger(users.length / max)
      ? users.length / max
      : Math.ceil(users.length / max);
    for (let i = 1; i <= pageCount; i++) {
      pages.push(i);
    }

    // _3-get present page
    page = parseInt(req.params.page) || page;
    console.log('req.params',req.params)

    // _4-set conditions for page
    if(page==1){
      verifyAccessToken
    }
    if (pageCount == 0) {
      return res.render("user_home", {
        pageTitle: "Empty",
        favIcon: "/img/icon_read.svg",
        page: page,
        isSearch: true,
      });
    }
    if (page > pageCount) {
      page = pageCount;
    }

    // _5-handle pages
    /*
                not     >   active  >   not
                start       page        end
        */
    let indexToSplit = pages.indexOf(page);
    let start = pages.slice(0, indexToSplit);
    let end = pages.slice(indexToSplit + 1);
    console.log(`${start} > ${page} > ${end}`);

    // _6-get users at present page
    const usersPage = await User.find({})
      .limit(max)
      .skip(max * (page - 1))
      .lean()
      .exec();

    // _7-render
    return res.render("user_home", {
      pageTitle: `users - Page ${page}`,
      favIcon: "/img/icon_read.svg",
      userActive: true,
      router:'users',
      usersPage: usersPage,
      count: usersPage.length,
      max: max,
      pages: pages,
      start: start,
      page: page,
      end: end,
      disablePrev: page == 1,
      disableNext: page == pageCount,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/detail/:_id", async (req, res, next) => {
  try {
    // _1-get user by id
    const user = await User.findById(req.params._id).lean().exec();

    // _2-render
    return res.render("user_detail", {
      pageTitle: "Detail",
      favIcon: "/img/icon_detail.svg",
      page: page,
      user: user,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// #CREATE
router.get("/create", (req, res, next) => {
  res.render("user_create", {
    pageTitle: "Add new User",
    favIcon: "/img/icon_create.svg",
    page: page,
  });
});

router.post("/create", async (req, res, next) => {
  try {
    console.log("req.body", req.body);

    const email = req.body.email;
    const password = req.body.password;
    const full_name = req.body.full_name;
    const avt =
      req.body.avt ;
    const admin = req.body.admin ;

    //    check email exists
    const isExists = await User.findOne({ email: email });
    if (isExists) {
      return res.render("user_create", {
        pageTitle: "Add new User",
        favIcon: "/img/icon_create.svg",
        page: page,
        notify: `${email} already used`,
      });
    }

    // _1-create new user
    const user = new User({
      email,
      password,
      full_name,
      avt,
      admin,
    });
    await user.save();

    // _2-success > back to List
    return res.redirect("/users/list/" + page);
  } catch (error) {
    res.status(500).send(error);
  }
});

// #UPDATE
router.get("/update/:_id", async (req, res, next) => {
  try {
    // _1-get user need update by id
    const user = await User.findById(req.params._id).lean().exec();

    // _2-render
    return res.render("user_update", {
      pageTitle: "Update User",
      favIcon: "/img/icon_update.svg",
      page: page,
      user: user,
      disableEmail: true,
      admin: user.admin == true,
    });
  } catch (error) {}
});

router.post("/update/:_id", async (req, res, next) => {
  try {
    console.log("req.body", req.body);

    // _1-update user by id
    const password = req.body.password;
    const full_name = req.body.full_name;
    const avt = req.body.avt;
    const admin = req.body.admin || false;

    const user = await User.findByIdAndUpdate(req.params._id, {
      password,
      full_name,
      avt,
      admin,
    })
      .lean()
      .exec();

    // _2-success > back to List
    return res.redirect("/users/list/" + page);
  } catch (error) {
    res.status(500).send(error);
  }
});

// #DELETE
router.get("/delete/:_id", async (req, res, next) => {
  try {
    // _1-delete user by id
    const user = await User.findByIdAndDelete(req.params._id).lean().exec();

    // _2-success > back to List
    return res.redirect("/users/list/" + page);
  } catch (error) {
    res.status(500).send(error);
  }
});

// #FIND
router.post("/list_search", async (req, res, next) => {
  console.log("req.body", req.body);

  try {
    // _1-empty search -> back to List
    if (!req.body.email && !req.body.full_name && !req.body.admin) {
      return res.redirect("/users/list/" + page);
    }

    console.log(!req.body.admin);
    // _2-filter
    const usersPage = await User.find({
      email: {
        $regex: req.body.email,
        $options: "i",
      },
      full_name: {
        $regex: req.body.full_name,
        $options: "i",
      },
      admin: !req.body.admin ? { $exists: true } : { $eq: req.body.admin },
    })
      .lean()
      .exec();

    // _3-render
    return res.render("user_home", {
      pageTitle: "Search",
      favIcon: "/img/icon_find.svg",
      page: page,
      usersPage: usersPage,
      isSearch: true,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
