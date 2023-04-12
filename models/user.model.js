const mongoose = require("mongoose");
const bcrypt = require('bcrypt')

// #database
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    avt: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/2648/2648307.png",
    },
    admin: {
      type: Boolean,
      default:false
    },
  },
  {
    collection: "users",
    versionKey: false,
  }
);

// #hash
UserSchema.pre("save", async function (next) {

  try {
    console.log(`User pre ___${this.email}  ___${this.password}`);
    
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(this.password,salt);
    this.password = hashPassword;
    next()
  } catch (error) {
    next(error)
  }

});

// #compare
UserSchema.methods.isCorrectPassword = async function(password){

  try {
    return await bcrypt.compare(password , this.password)
  } catch (error) {
    next(error)
  }
}

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
