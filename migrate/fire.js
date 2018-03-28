var firebase = require("firebase");
var Video = require('../models/video');
var User = require('../models/user');
var _ = require('lodash');
var Interaction = require('../models/interaction');
var async = require('async');
var fcm = require('../utils/notification');

var config = {
    apiKey: 'AIzaSyCbcgJi0iXxJRJTL1pG2FOKjeF0qaIU3cQ',
    authDomain: 'popi-3b329.firebaseio.com/',
    databaseURL: 'https://popi-3b329.firebaseio.com/',
    storageBucket: ''
};

firebase.initializeApp(config);
var db = firebase.database();

var videosReference = db.ref('/videos');
var usersReference = db.ref('/users');
var interactionsReference = db.ref('/interactions');

var mongoose = require('mongoose');

mongoose.connect(process.env.POPIDB);

mongoose.connection.on('connected', function () {
    // after a succesful connection start listening firebase
    videosReference.on('child_added', function (data) {
        saveVideoToMongoAdd(data.val(), data.key);
    });

    usersReference.on('child_added', function (data) {
        saveUserToMongo(data.val(), data.key);
    });

    interactionsReference.on('child_added', function (data) {
        saveInteractionToMongo(data.val(), data.key);
    });

    videosReference.on('child_changed', function (data) {
        saveVideoToMongoChange(data.val(), data.key);
    });

    usersReference.on('child_changed', function (data) {
        saveUserToMongo(data.val(), data.key);
    });
});

function saveVideoToMongoChange(data, key) {
    var video = new Video(data);

    var videoData = video.toObject();

    delete videoData.user;
    delete videoData._id;

    videoData.fbId = key;
    videoData.user = data.user.fbId;
    Video.update({fbId: key}, {$set: videoData}, {upsert: true}, function (err, data) {
        if (err) {
            return;
        }
    });
}

function saveVideoToMongoAdd(data, key) {
    async.seq(
        function (cb) {
            Video
                .find({fbId: key})
                .lean()
                .exec(function (err, data) {
                    if (err || data.length === 0) {
                        cb();
                    } else {
                        return;
                    }
                });
        },
        function (cb) {
            User.findOne({fbId: data.user.fbId})
                .populate('followees')
                .exec(function (err, user) {
                    if (err || !user) {
                        return;
                    }
                    async.each(user.followees, function (user, callback) {
                        fcm.sendNotification(user.firebaseToken, '🎊🎬Yeni Video', data.user.name  + ' ' + data.title  + ' isimli yeni bir video paylaştı');
                        callback();
                    }, function (err) {
                        cb();
                    });

                });
        }
    )(function () {
        var video = new Video(data);

        var videoData = video.toObject();

        delete videoData.user;
        delete videoData._id;

        videoData.fbId = key;
        videoData.user = data.user.fbId;
        Video.update({fbId: key}, {$set: videoData}, {upsert: true}, function (err, data) {
            if (err) {
                return;
            }
        });
    });
}

function saveInteractionToMongo(data, key) {
    async.seq(
        function (cb) {
            Interaction
                .find({fbId: key})
                .lean()
                .exec(function (err, data) {
                    if (err || data.length === 0) {
                        cb();
                    } else {
                        return;
                    }
                });
        },
        function (cb) {
            User.findOne({fbId: data.user}, function (err, user) {
                if (err || !user) {
                    return;
                }
                cb(null, user);
            });
        },
        function (user, cb) {
            Video
                .findOne({fbId: data.post})
                .populate({path: 'userObject', select: 'name fbId gender popiPoint'})
                .exec(function (err, video) {
                    if (err) {
                        return;
                    }
                    cb(null, user, video);
                });
        }
    )(function (err, user, video) {

        var interaction = new Interaction(data);
        var intData = interaction.toObject();

        delete intData.user;
        delete intData.post;
        delete intData._id;

        intData.fbId = key;
        intData.user = user.fbId;
        if (video && video.fbId)
            intData.post = video.fbId;
        if (data.type === 2) {
            User.update(
                {fbId: user.fbId},
                {$addToSet: {videosLiked: video._id}},
                function (err, data) {

                }
            );
        } else if (data.type === 3) {
            User.update(
                {fbId: user.fbId},
                {$addToSet: {videosDisliked: video._id}},
                function (err, data) {

                }
            );
        }

        Interaction.update({fbId: key}, {$set: intData}, {upsert: true}, function (err, data) {
            if (err) {
                return;
            }
        });
    });
}

function saveUserToMongo(data, key) {
    var user = new User(data);
    var userData = user.toObject();
    delete userData._id;
    delete userData.followers;
    delete userData.followees;
    delete userData.videosLiked;
    delete userData.videosDisliked;
    //delete userData.isPremium;
    userData.fbId = key;

    User.update({fbId: key}, {$set: userData}, {upsert: true}, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
    });
}
