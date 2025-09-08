const model = require('../model/userModel');
const users = model.users;
const chats = model.chats;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;

// cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});
require('dotenv').config();

// it render all users page
exports.allUsers = async (req, res) => {
  try {
    const user = await users.find({ _id: { $ne: req.user } }).select('-password');
    const loginUser = await users.findById(req.user).select('-password');
    res.status(200).send({ users: user, loginUser: loginUser });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it saves the friend request in db
exports.saveRequest = async (sender, reciever, callback) => {
  try {
    const user = await users.findById(sender);
    if(user.friendReq.includes(reciever)) {
      return callback('can not send friend request. user already sent friend request', "in friendReq", null);
    }
    await users.updateOne({ _id: sender }, { $push: { sentReq: reciever } })
    await users.updateOne({ _id: reciever }, { $push: { friendReq: sender } })
    const reqSender = await users.findById(sender).select('-password -sentReq -username -friends -friendReq');
    const reqReciever = await users.findById(reciever).select('-password -sentReq -username -friends')
    const friendReq = await users.find({ _id: { $in: reqReciever.friendReq } }).select('-password -sentReq -username -friends -friendReq');    
    callback(null, reqSender, friendReq.length);
  } catch (error) {
    console.log(error);
    callback(error, null, null);
  }
}
// it shows friend reqs on webpage
exports.friends = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    const friendReq = await users.find({ _id: { $in: user.friendReq } }).select('-password -sentReq -username -friends -friendReq');
    const friends = await users.find({ _id: { $in: user.friends } }).select('-password -sentReq -username -friends -friendReq');
    res.status(200).send({ friendReq: friendReq, friends: friends });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it accpets the friend request and save it in db
exports.acceptRequest = async (sender, reciever, callback) => {
  try {    
    const user = await users.findById(reciever);
    if(!user.friendReq.includes(sender)) {
      return callback('no such request found', "no req", sender);
    }
    await users.updateOne({ _id: sender }, { $push: { friends: reciever } })
    await users.updateOne({ _id: reciever }, { $push: { friends: sender } })
    await users.updateOne({ _id: sender }, { $pull: { sentReq: reciever } })
    await users.updateOne({ _id: reciever }, { $pull: { friendReq: sender } })
    const recieverObj = await users.findById(reciever).select('-password -sentReq -username -friends -friendReq');
    const senderObj = await users.findById(sender).select('-password -sentReq -username -friends -friendReq');
    callback(null, recieverObj, senderObj);
  } catch (error) {
    console.log(error);
    callback(error, null);
  }
}

// it resets the password
  exports.passwordReset = async (req, res) => {
  try {
    const user = await users.findById(req.user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.authType === 'google') {
      return res.status(400).json({ success: false, message: 'Google users cannot reset password' });
    }

    // Check old password
    const isValid = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid old password' });
    }

    // Generate new salt and hash new password
    const saltRounds = parseInt(process.env.SALT);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, saltRounds);

    user.password = hashedPassword; // ✅ store directly
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
};

// it updates the name is db
exports.changeName = async (req, res) => {
  try {
    await users.updateOne({ _id: req.user }, { name: req.body.name });
    res.status(200).send({ success: true, name: req.body.name });
  } catch (error) {
    console.log(err);
    res.status(500).send({ success: false })
  }
}

// it updates the profile is db and cloudinary
exports.changeProfile = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    let profileImg, profileId;
    if (user.profile.startsWith('http')) {
      profileImg = user.profile.split('/')[9];
      profileId = profileImg.slice(0, profileImg.lastIndexOf('.'));
    }
    let public_id = 'chatapp/profiles/' + profileId
    let filepath, file;
    if (req.file) {
      file = req.file;
    }

    if (file) {
      // Upload to cloudinary
      await cloudinary.uploader.upload(req.file.path, {
        folder: 'chatapp/profiles',
      }, async (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false
          })
        } else {
          filepath = result.url;
          user.profile = filepath;
          await user.save();
          res.status(200).send({ success: true, profile: filepath });
        }
      })
    }

    if (profileId && file) {
      // delete image from cloudinary
      await cloudinary.uploader
        .destroy(public_id)
        .then(() => {
          console.log("image replaced");
        })
        .catch((error) => {
          console.log(error);
        });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false })
  }
}
// it show user details when clicked on a user
exports.showUserDetails = async (req, res) => {
  try {
    const currentUser = await users.findById(req.user)
    const user = await users.findById(req.query.userId).select('-password -sentReq -friends -friendReq -username');
    let relation = "none"; 

if (currentUser.friends.includes(req.query.userId)) {
  relation = "friends";
} else if (currentUser.friendReq.includes(req.query.userId)) {
  relation = "friendReq";
} else if (currentUser.sentReq.includes(req.query.userId)) {
  relation = "friendReqSent";
}
    res.status(200).send({ user, relation});
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// unfriends an user
exports.unFriend = async (current, other, cb) => {
  try {
    const user = await users.findById(current);
    if(!user.friends.includes(other)) {
      return cb('no such friend found', null, null);
    }
    await users.updateOne({ _id: current }, { $pull: { friends: other } })
    await users.updateOne({ _id: other }, { $pull: { friends: current } })
    cb(null, current, other);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it cancels the sent friend request
exports.cancelSentRequest = async (req, res) => {
  try {
    const user = await users.findById(req.user);
    if(!user.sentReq.includes(req.params.id)) {
      return res.status(404).json({ message: "no request found. Refresh the page" });
    }
    await users.updateOne({ _id: req.user }, { $pull: { sentReq: req.params.id } })
    await users.updateOne({ _id: req.params.id }, { $pull: { friendReq: req.user } })
    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
// it delete the friend request
exports.deleteFriendRequest = async (req, res) => {
  try {    
    const user = await users.findById(req.user);
    if(!user.friendReq.includes(req.params.id)) {
      return res.status(404).json({ message: "no request found. Refresh the page" });
    }
    await users.updateOne({ _id: req.user }, { $pull: { friendReq: req.params.id } })
    await users.updateOne({ _id: req.params.id }, { $pull: { sentReq: req.user } })
    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}
exports.userChats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const userChats = await chats.find({
      $or: [
        { sender: userId },
        { reciever: userId }
      ]
    });

    const userIdSet = new Set();

    userChats.forEach(chat => {
      const senderId = chat.sender.toString();
      const receiverId = chat.reciever.toString();
      const currentUserId = userId.toString();

      if (senderId !== currentUserId) userIdSet.add(senderId);
      if (receiverId !== currentUserId) userIdSet.add(receiverId);
    });

    const otherUserIds = Array.from(userIdSet).map(id => id !== 'undefined' ? id.toString() : console.log(id));

    const userList = await users.find(
      { _id: { $in: otherUserIds } },
      '-password'
    );
    res.status(200).json(userList);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'internal server error. unable to take this request. pls try again later.' })
  }
}