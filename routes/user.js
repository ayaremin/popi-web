var express = require('express');
var router = express.Router();
var async = require('async');
var Interaction = require('../models/interaction');
var User = require('../models/user');
var Video = require('../models/video');


router.post('/', function (req, res, next) {
    User
        .findOne ({fbId: req.body.user})
        .exec(function (err, user) {
            if (err || !user) {
                return res.status(400).send({err: 'Kullanıcı bulunamadı'});
            }
            return res.json({status: 'success', message: 'User Detail', count: 1, data: user});
        });
});

router.put('/', function (req, res, next) {
    User.update({fbId: req.body.fbId}, {$set: req.body}, {upsert: true}, function (err, data) {
        if (err) {
            return;
        }
        User
            .findOne ({fbId: req.body.fbId})
            .exec(function (err, user) {
                if (err || !user) {
                    return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                }
                return res.json({status: 'success', message: 'User Detail', count: 1, data: user});
            });
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
        .select ('type userObject video createdAt fbId post user')
        .skip(perPage * page)
        .exec(function (err, data) {
            if (err) {
                return res.status(400).send({err: 'Etkileşim bulunamadı'});
            }
            return res.json({status: 'success', message: 'Interactions', count: data.length, data: data});
        });
});

router.post ('/videos', function (req, res, next) {
    var userId = req.body.user;

    async.seq(
        function (cb) {
            User.findOne({fbId: userId}, function (err, user) {
                if (err) {
                    return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                }
                cb(null, user);
            });
        },
        function (user, cb) {
            var perPage = req.query.limit;
            var page = req.query.page;
            Video
                .find({user: user.fbId, isDeleted: false})
                .sort({createdAt: 'desc'})
                .skip(perPage * page)
                .limit(perPage)
                .populate({path: 'userObject', select: 'name fbId gender popiPoint', options: { lean: true}})
                .lean()
                .exec(function (err, videos) {
                    if (err) {
                        console.log(err);
                        return res.status(400).send({err: 'Videolar bulunamadı'});
                    }
                    cb(null, videos);
                });
        }
    )(function (err, data) {
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            res.json({status: 'success', message: 'Videolar', count: data.length, data: data});
        }
        return res;
    });
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
