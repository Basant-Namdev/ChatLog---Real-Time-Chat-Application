const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.diskStorage({}) });
const inController = require('../controller/inController');

router
     .get('/allUsers', inController.allUsers)
     .get('/showUserDetails', inController.showUserDetails)
     .get('/showUserDetails', inController.showUserDetails)
     .get('/friends', inController.friends)
     .get('/userChats', inController.userChats)
     .post('/passwordReset', inController.passwordReset)
     .post('/changeName', inController.changeName)
     .post('/changeProfile', upload.single('image') , inController.changeProfile)
     .patch('/:id',inController.unFriend)
     .patch('/cancel-sent-request/:id',inController.cancelSentRequest)
     .patch('/delete-friend-request/:id',inController.deleteFriendRequest)
     .get('/userChats',inController.userChats)
      
exports.router = router;