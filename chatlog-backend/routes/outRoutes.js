const express = require('express');
const router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const outController = require('../controller/outController');

outController.initializePass(passport);
router
    .post('/signUp', outController.signUp)
    .post('/login',outController.login)
    .post('/auth/refresh',outController.refresh)
    .get('/dashbord',outController.isAuth,outController.openDashbord)
    .post('/dashbord/loadChat',outController.isAuth,outController.loadChat)
    .get('/dashbord/logout', outController.logOut)
    .get('/auth/google',passport.authenticate('google',{session:false,scope:["Profile","email"]}))
    .get('/auth/google/callback',passport.authenticate('google',{session:false,failureRedirect : "/"}),(req, res) => {
    outController.generateToken(req, res,req.user,"google");
  });
    
exports.router = router;