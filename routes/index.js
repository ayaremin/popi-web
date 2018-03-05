var express = require('express');
var router = express.Router();
var path    = require('path');
var Admin = require('../models/admin');
var dialog = require('dialog');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.user) {
        res.sendFile((path.join(__dirname+'/../index.html')));
    } else {
        res.redirect('/login');
    }
});

router.get('/login', function(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
    } else {
        res.sendFile((path.join(__dirname+'/../login.html')));
    }
});

router.post('/login', function (req, res, next) {
    var pass = req.body.password;
    var email = req.body.email;

    Admin.findOne({email: email}, function (err, user) {
        if (err || !user) {
            return res.status(400).send({err: 'Emailiniz ile eşleşen bir kullanıcı bulunamadı'});
        }
        if (user.password !== pass) {
            return res.status(400).send({err: 'Girdiğiniz parola yanlış'});
        }
        req.session.user = user;
        res.redirect('/');
    });
});

module.exports = router;
