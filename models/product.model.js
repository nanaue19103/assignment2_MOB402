const mongoose = require("mongoose");

// #database
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default:0
    },
    img: {
      type: String,
      required: true,
    },
    color: {
      type: String,
    },
    category: {
      type: String,
    },
  },
  {
    collection: "products",
    versionKey: false,
  }
);

const ProductModel = mongoose.model("product", ProductSchema);

module.exports = ProductModel;
