var express = require('express');
var async = require('async');
var router = express.Router();
var path = require('path');
var Admin = require('../models/admin');
var User = require('../models/user');
var AWS = require('aws-sdk');
var fs = require('fs');
var ffmpeg = require('ffmpeg');
var promise = require('promise');
// For dev purposes only
AWS.config.update({accessKeyId: 'AKIAJRC7DLNEHD2NRRMQ', secretAccessKey: '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'});

var s3 = new AWS.S3();

var myBucket = 'popiapp-hosting-mobilehub-496562667/videos';

router.get('/', function (req, res, next) {
    if (req.session.user) {
        res.sendFile((path.join(__dirname + '/../admin.html')));
    } else {
        res.redirect('/admin/login');
    }
});

router.get('/reset', function (req, res, next) {
    if (req.session.user) {
        res.sendFile((path.join(__dirname + '/../admin.html')));
    } else {
        async.seq(
            function (cb) {
                var query = {
                    fbId: {$in: ['q7rwMUJNs8drGtd3TflUKFT5UsQ2', 'n1qSVHUZm0aV7P7UJ0sJ77zAaer1', '6JUtseWTXfhQSsJMsyKjFTkmd713', 'ISstjwr1ISb4mqcdbD2nWXYJCQk2']}
                };
                var update = {
                    videosLiked: [],
                    videosDisliked: []
                };

                User.update(query, {$set: update}, {multi: true, upsert: true}, function (err, data) {
                    if (err) {
                        return;
                    }
                    return res.json({status: 'success', message: 'Güncelleme başarılı', data:data});
                });
            }
        )();
    }
});

router.get('/login', function (req, res, next) {
    if (req.session.user) {
        res.redirect('/admin');
    } else {
        res.sendFile((path.join(__dirname + '/../login.html')));
    }
});

router.get('/logout', function (req, res, next) {

    req.session.reset();

    if (req.session.user) {
        res.redirect('/admin');
    } else {
        res.redirect('/admin/login');
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
        res.redirect('/admin');
    });
});

/* UPLOAD*/
router.post('/upload', function (req, res, next) {
    var fname = appendToFilename(req.body.filename, new Date().getTime());
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
    var params = {Bucket: myBucket, Key: fname, Body: _base64ToArrayBuffer(req.body.encoded)};
    s3.putObject(params, function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.status(400).send({success: false});
        } else {
            return res.status(200).send({success: true, filename: fname});
        }
    });
});

function _base64ToArrayBuffer(base64) {
    var b64string = base64;
    var str = b64string.replace(/^data:video\/[a-z]+;base64,/, "");
    var buf = Buffer.from(b64string.split("base64,")[1], 'base64');
    return buf;
}

function appendToFilename(filename, string) {
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + string;
    else return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

module.exports = router;
