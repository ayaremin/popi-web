var express = require('express');
var async = require('async');
var Video = require('../models/video');
var User = require('../models/user');
var moment = require('moment');
var _ = require('lodash');
var router = express.Router();

var mongoose = require('mongoose');

mongoose.connect('mongodb://104.236.87.130:27017/popiDatabase');

/* Get unwatched videos to user */
router.post('/', function (req, res, next) {
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
            var combinedList = user.videosLiked.concat(user.videosDisliked);
            console.log(combinedList);
            Video
                .find({ _id: { $nin: combinedList }, isDeleted: false })
                .populate('userObject')
                .skip(perPage * page)
                .limit(perPage)
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
            res.json({status: 'ok', message: 'Videos fetched' , count: data.length, data: data});
        }
        return res;
    });
});

/* Get trend videos */
router.post('/trend', function (req, res, next) {
    var userId = req.body.user;
    var now = moment().startOf('day');
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
            var limit = 30;
            Video
                .find({ createdAt: { $gte : now.subtract(2,'day')}, isDeleted: false })
                .populate('user')
                .limit(limit)
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
            res.json({status: 'ok', message: 'Videos fetched', data: data});
        }
        return res;
    });
});

module.exports = router;
