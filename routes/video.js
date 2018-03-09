var express = require('express');
var async = require('async');
var Video = require('../models/video');
var User = require('../models/user');
var path    = require('path');
var moment = require('moment');
var _ = require('lodash');
var AWS = require('aws-sdk');
var fs = require('fs');
var ffmpeg = require('ffmpeg');
var promise = require('promise');
var router = express.Router();
var mongoose = require('mongoose');

mongoose.connect('mongodb://104.236.87.130:27017/popiDatabase');

AWS.config.update({ accessKeyId: 'AKIAJRC7DLNEHD2NRRMQ', secretAccessKey: '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' });

var s3 = new AWS.S3();

var myBucket = 'popiapp-hosting-mobilehub-496562667/videos';


router.get('/detail/:id', function(req, res, next) {
    var videoId = req.params.id;
    Video
        .findOne({fbId: videoId})
        .populate({path:'userObject', select:'name fbId gender popiPoint'})
        .exec(function (err, video) {
            if (err || !video) {
                return res.status(400).send({err: 'Video bulunamadı'});
            }
            res.render((path.join(__dirname+'/../video-detail.ejs')), {video: video});
        });
});

/* UPLOAD*/
router.post('/upload', function(req, res, next) {
    var video = req.body.video;

    var fname =  appendToFilename(req.body.filename, new Date().getTime());


    /*fs.writeFile(req.body.filename, req.body.encoded.split("base64,")[1], 'base64', function(err) {
     try {
     var process = new ffmpeg(req.body.filename);
     process.then(function (video) {

     video.addCommand('-lavfi', '"[0:v]scale=ih*16/9:-1,boxblur=luma_radius=min(h\,w)/20:luma_power=1:chroma_radius=min(cw\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,crop=h=iw*9/16[bl];[bl][1:v]overlay=10:10"');
     video
     .setVideoSize('640x?', true, true, '#fff')
     .save('efgasdsa.mp4', function (error, file) {
     if (!error)
     console.log('Video file: ' + file);
     else
     console.log(error);
     });

     }, function (err) {
     console.log('Error: ' + err);
     });
     } catch (e) {
     console.log(e.code);
     console.log(e.msg);
     }
     });
     return res.status(400).send({success:false});*/
    var params = {Bucket: myBucket, Key:fname, Body: _base64ToArrayBuffer(req.body.encoded)};
    s3.putObject(params, function(err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.status(400).send({success:false});
        } else {
            return res.status(200).send({success:true, filename:fname});
        }
    });
});

function _base64ToArrayBuffer(base64) {
    var b64string = base64;
    var str = b64string.replace(/^data:video\/[a-z]+;base64,/, "");
    var buf = Buffer.from(b64string.split("base64,")[1], 'base64');
    return buf;
}

function appendToFilename(filename, string){
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + string;
    else return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

/* Get unwatched videos to user */
router.post('/', function (req, res, next) {
    var userId = req.body.user;
    var videoId = req.body.videoId;

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
        },
        function (videos, cb) {
            // if a deeplink clicked so add clicked video to first index of list
            if (videoId) {
                Video
                    .findOne({fbId: videoId})
                    .populate({path:'userObject', select:'name fbId gender popiPoint'}) // <--
                    .exec(function (err, video) {
                        if (err) {
                            return res.status(400).send({err: 'Video bulunamadı'});
                        }
                        videos.unshift(video);
                        cb(null, videos);
                    });
            } else {
                cb(null, videos);
            }
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
        var sliced = data.slice(0,30);
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            res.json({status: 'success', message: 'Trend Videolar', count: sliced.length, data: sliced});
        }
        return res;
    });
});

module.exports = router;
