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
                .lean()
                .populate({path:'userObject', select:'name fbId gender popiPoint'})
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
            res.json({status: 'success', message: 'Videolar' , count: data.length, data: data});
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
                if (err || !user) {
                    return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                }
                cb(null, user);
            });
        },
        function (user, cb) {
            Video
                .find({ createdAt: { $gte : now.subtract(20,'day')}, isDeleted: false })
                .populate({path:'userObject', select:'name fbId gender popiPoint'})
                .lean()
                .exec(function (err, videos) {
                    if (err) {
                        console.log(err);
                        return res.status(400).send({err: 'Videolar bulunamadı'});
                    }
                    cb(null, videos);
                });
        }, function (videos, cb) {
            var scoredVideos = [];
            _.forEach(videos, function (video) {
                var score = 0;
                score += (video.viewCompleted / video.viewStarted)*30;
                score += ((video.like - video.dislike)/video.viewStarted)*65;
                score += Math.max(0,video.userObject.popiPoint/1000) * 5;
                video.score = score;
                scoredVideos.push(video);
            });

            cb(null, _.orderBy(scoredVideos, [function(o) {
                return o.score
            }, function (o) {
                return o.viewCompleted
            }, function (o) {
                return o.like/o.dislike
            }]));
        }
    )(function (err, data) {
        data.slice(0,30);
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            res.json({status: 'success', message: 'Trend Videolar', count: data.length, data: data});
        }
        return res;
    });
});

module.exports = router;
