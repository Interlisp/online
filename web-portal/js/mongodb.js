/*******************************************************************************
 * 
 *   mongodb.js: Support for the mongodb user registration database for
 *               online.interlisp.org.  Used by both the userRouter (user.js)
 *               and the adminRouter (admin.js)
 *
 *  
 *   2022-02-08 Frank Halasz
 * 
 * 
 *   Copyright: 2022 by Interlisp.org 
 * 
 *
 ******************************************************************************/
 
const config = require("./config");
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');


mongoose.connect(`${config.mongodbURI}`, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {type: String, unique: true },
  password: String,
  uname: String,
  firstname: String,
  lastname: String,
  initials: String,
  nodisclaimer: { type: Boolean, default: false},
  isVerified: { type: Boolean, default: false },
  created: {type: Date, default: 0 },
  lastLogin: {type: Date, default: 0 },
  numLogins: {type: Number, default: 0 },
  verificationToken: {type: String, default: "notAssigned"},
  isAdmin: {type: Boolean, default: false},
  noFileMgrWarning: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);
const userModel = mongoose.model('userInfo', userSchema, 'userInfo');

exports.userSchema = userSchema;
exports.userModel = userModel;
