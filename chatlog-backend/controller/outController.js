const path = require('path');
const model = require('../model/userModel');
const users = model.users;
const chats = model.chats;
const Token = model.Token;
const mongoose = require('mongoose');
const localStrategy = require('passport-local');
const googleStrategy = require('passport-google-oauth20')
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cloudinary = require('cloudinary').v2;

// cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

require('dotenv').config();

var salt = bcrypt.genSaltSync(parseInt(process.env.SALT));

// user signUp function
exports.signUp = async (req, res) => {
  try {
    const user = await users.find({ username: req.body.username });

    if (user.length > 0) { return res.status(400).json({ message: "Email already in use" }); }
    const newUser = new users();
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);


    newUser.name = req.body.name;
    newUser.profile = "/public/images/blank profile.jpg";
    newUser.username = req.body.username;
    newUser.password = hashedPassword.toString('hex');
    newUser.save()
      .then(() => {
        res.status(201).json({ success: true })
      })
      .catch(error => {
        console.log("Error Creating User", error);
        res.status(500).json({ success: false })
      })
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }
};
const generateToken = async (req, res, user, authType) => {
  // create jwt token
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }   // valid for 15 minutes
  );

  const refreshToken = jwt.sign(
    { id: user._id, username: user.username },
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: "7d" }   // valid for 7 days
  );

  // store refresh token in DB
  await Token.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    // secure: process.env.ENVIRONMENT === 'development' ? false : true, // set to true in production
    // sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return authType !== "google" ? token : res.redirect(`${process.env.FRONTEND_URL}/dashbord`);
}
exports.generateToken = generateToken;
// user login function
exports.login = async (req, res) => {
  try {
    const user = await users.findOne({ username: req.body.username });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const token = await generateToken(req, res, user);
    return res.json({ success: true, userId: user._id, token, redirectUrl: `${process.env.FRONTEND_URL}/dashbord` });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }
};
// middleware between login to profile
exports.isAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // Bearer <token>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid token" });

      req.user = decoded.id; // store userId in req.user
      next();
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
};

// it opens user dashbord
exports.openDashbord = async (req, res) => {
  try {
    const user = await users.find({ _id: { $ne: req.user } }).select('-password');
    const loginUser = await users.findById(req.user).select('-password');
    const friendReq = await users.find({ _id: { $in: loginUser.friendReq } }).select('-password -sentReq -username -friends -friendReq');
    res.status(200).json({ user, loginUser, friendReq });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error.pls try again later.' })
  }

}
// load old chats
exports.loadChat = async (req, res) => {
  try {
    const userChats = await chats.find({ $or: [{ sender: req.user, reciever: req.body.recieverId }, { sender: req.body.recieverId, reciever: req.user }] });
    res.json(userChats);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to open chat. pls try again later.' })
  }
}
// chat saving function
exports.saveChat = async (sender, reciever, message, callback) => {
  try {
    const newMsg = new chats();
    newMsg.sender = sender;
    newMsg.reciever = reciever;
    newMsg.message = message;
    await newMsg.save();
    callback(null, newMsg);
  } catch (error) {
    console.log(error);
    callback(error, null);
  }
}

// logout function
exports.logOut = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await Token.deleteOne({ token: refreshToken }); // remove from DB
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === "production",
      sameSite: process.env.ENVIRONMENT === "production" ? "None" : "Lax",
    });

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// passport initialization
exports.initializePass = (passport) => {
  passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET_KEY,
    callbackURL: process.env.ENVIRONMENT !== 'development' ? process.env.GOOGLE_CALLBACK_URL_PRO : process.env.GOOGLE_CALLBACK_URL_LOCAL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await users.findOne({ username: profile.emails[0].value })
      if (!user) {
        let cloudinaryUrl = profile.photos[0]?.value;
        if (cloudinaryUrl) {
          // Upload to cloudinary
          await cloudinary.uploader.upload(cloudinaryUrl, {
            folder: 'chatapp/profiles',
          }, async (err, result) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                success: false
              })
            } else {
              cloudinaryUrl = result.url;
            }
          })
        }
        user = await users.create({
          name: profile.displayName,
          username: profile.emails[0].value,
          profile: cloudinaryUrl || "/public/images/blank profile.jpg",
          authType: "google",
        })
      }
      return done(null, user)
    } catch (error) {
      return done(error, null);
    }
  }))
};
// token refresh function
exports.refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token" });
  }

  try {
    // verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);

    // check if refresh token exists in DB
    const dbToken = await Token.findOne({ token: refreshToken });
    if (!dbToken) return res.status(403).json({ success: false, message: "Invalid refresh token" });

    // create new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // short-lived
    );

    return res.json({ success: true, token: newAccessToken, userId: decoded.id });
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid refresh token" });
  }
};
