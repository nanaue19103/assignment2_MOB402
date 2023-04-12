require("dotenv").config();
const express = require("express");
const Product = require("../models/product.model");

const router = express.Router();

// 'page' is global variable (to handle back button to List)
var page = 1;

// #READ
router.get("/list/:page", async (req, res, next) => {

  try {
    // _1-get all products
    const products = await Product.find({}).lean().exec();

    // _2-get all pages
    const pages = [];
    const max = 10;
    const pageCount = Number.isInteger(products.length / max)
      ? products.length / max
      : Math.ceil(products.length / max);
    for (let i = 1; i <= pageCount; i++) {
      pages.push(i);
    }

    // _3-get present page
    page = parseInt(req.params.page) || page;
    console.log("req.params", req.params);

    // _4-set conditions for page
    if (pageCount == 0) {
      return res.render("product_home", {
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

    // _6-get products at present page
    const productsPage = await Product.find({})
      .limit(max)
      .skip(max * (page - 1))
      .lean()
      .exec();

    // _7-render
    return res.render("product_home", {
      pageTitle: `products - Page ${page}`,
      favIcon: "/img/icon_read.svg",
      productActive:true,
      router:'products',
      productsPage: productsPage,
      count: productsPage.length,
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
    // _1-get product by id
    const product = await Product.findById(req.params._id).lean().exec();

    // _2-render
    return res.render("product_detail", {
      pageTitle: "Detail",
      favIcon: "/img/icon_detail.svg",
      page: page,
      product: product,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// #CREATE
router.get("/create", (req, res, next) => {
  res.render("product_create", {
    pageTitle: "Add new product",
    favIcon: "/img/icon_create.svg",
    page: page,
  });
});

router.post("/create", async (req, res, next) => {
  try {
    console.log("req.body", req.body);

    const {name,price,img,color,category} = req.body;

    // _1-create new product
    const product = new Product({
      name,
      price,
      img,
      color,
      category,
    });
    await product.save();

    // _2-success > back to List
    return res.redirect("/products/list/" + page);
  } catch (error) {
    res.status(500).send(error);
  }
});

// #UPDATE
router.get("/update/:_id", async (req, res, next) => {
  try {
    // _1-get product need update by id
    const product = await Product.findById(req.params._id).lean().exec();

    // _2-render
    return res.render("product_update", {
      pageTitle: "Update product",
      favIcon: "/img/icon_update.svg",
      page: page,
      product: product,
      disableEmail: true,
    });
  } catch (error) {}
});

router.post("/update/:_id", async (req, res, next) => {
  try {
    console.log("req.body", req.body);

    // _1-update product by id
        const { name, price, img, color, category } = req.body;



    const product = await Product
      .findByIdAndUpdate(req.params._id, {
        name,
        price,
        img,
        color,
        category,
      })
      .lean()
      .exec();

    // _2-success > back to List
    return res.redirect("/products/list/" + page);
  } catch (error) {
    res.status(500).send(error);
  }
});

// #DELETE
router.get("/delete/:_id", async (req, res, next) => {
  try {
    // _1-delete product by id
    const product = await Product.findByIdAndDelete(req.params._id).lean().exec();

    // _2-success > back to List
    return res.redirect("/products/list/" + page);
  } catch (error) {
    res.status(500).send(error);
  }
});

// #FIND
router.post("/list_search", async (req, res, next) => {
  console.log("req.body", req.body);

  try {
    // _1-empty search -> back to List
    if (!req.body.name && !req.body.price) {
      return res.redirect("/products/list/" + page);
    }

    // _2-filter
    const productsPage = await Product.find({
      name: {
        $regex: req.body.name,
        $options: "i",
      },
      price: !req.body.price ? { $exists: true } : { $eq: req.body.price },
    })
      .lean()
      .exec();

    // _3-render
    return res.render("product_home", {
      pageTitle: "Search",
      favIcon: "/img/icon_find.svg",
      page: page,
      productsPage: productsPage,
      isSearch: true,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
