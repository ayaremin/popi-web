var express = require('express');
var router = express.Router();
var async = require('async');
var Interaction = require('../models/interaction');
var User = require('../models/user');

router.post('/', function (req, res, next) {
    User
        .findOne ({fbId: req.body.user})
        .lean()
        .exec(function (err, user) {
            if (err || !user) {
                return res.status(400).send({err: 'Kullanıcı bulunamadı'});
            }
            return res.json({status: 'success', message: 'User Detail', count: 1, data: user});
        });
});

router.post('/interactions', function (req, res, next) {
    var perPage = 50;
    var page = req.query.page;
    var user = req.body.user;

    var query = {
        whose: user,
        $or: [{type: 2}, {type: 3}]
    };

    Interaction
        .find(query)
        .populate ({path: 'video', select: 'title'})
        .populate ({path: 'userObject', select: 'fbId name education name birthdate popiPoint profilePicture'})
        .lean()
        .skip(perPage * page)
        .exec(function (err, data) {
            if (err) {
                return res.status(400).send({err: 'Etkileşim bulunamadı'});
            }
            return res.json({status: 'success', message: 'Interactions', count: data.length, data: data});
        });
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
