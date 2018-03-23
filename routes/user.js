var express = require('express');
var router = express.Router();
var async = require('async');
var Interaction = require('../models/interaction');
var User = require('../models/user');
var Video = require('../models/video');
var fcm = require('../utils/notification');
var firebase = require('firebase');

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

router.post('/', function (req, res, next) {
    User
        .findOne({fbId: req.body.user})
        .exec(function (err, user) {
            if (err || !user) {
                return res.status(400).send({err: 'Kullanıcı bulunamadı'});
            }
            return res.json({status: 'success', message: 'User Detail', count: 1, data: user});
        });
});

router.get('/detail/:id', function (req, res, next) {
    async.seq(
        function (cb) {
            User
                .findOne({fbId: req.params.id})
                .lean()
                .exec(function (err, user) {
                    if (err || !user) {
                        return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                    }
                    cb(null, user);
                });
        }
    )(function (err, data) {
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            res.json({status: 'success', message: 'Kullanıcı', count: 1, data: data});
        }
        return res;
    });
});

router.put('/', function (req, res, next) {
    User.update({fbId: req.body.fbId}, {$set: req.body}, {upsert: true}, function (err, data) {
        if (err) {
            return;
        }
        User
            .findOne({fbId: req.body.fbId})
            .exec(function (err, user) {
                if (err || !user) {
                    return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                }
                return res.json({status: 'success', message: 'User Detail', count: 1, data: user});
            });
    });
});

router.put('/preference', function (req, res, next) {
    User.update({fbId: req.body.fbId}, {$set: {preferences: req.body.preferences}}, {upsert: true}, function (err, data) {
        if (err) {
            return;
        }
        User
            .findOne({fbId: req.body.fbId})
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
        $or: [{type: 2}, {type: 3}, {type: 9}, {type: 10}, {type: 8}]
    };
    Interaction
        .find(query)
        .populate({path: 'video', select: 'title'})
        .populate({path: 'userObject', select: 'fbId name education name birthdate popiPoint profilePicture'})
        .select('type userObject video createdAt fbId post user')
        .sort({createdAt: 'desc'})
        .skip(perPage * page)
        .exec(function (err, data) {
            if (err) {
                return res.status(400).send({err: 'Etkileşim bulunamadı'});
            }
            return res.json({status: 'success', message: 'Interactions', count: data.length, data: data});
        });
});

router.post('/videos', function (req, res, next) {
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
                .populate({path: 'userObject', select: 'name fbId gender popiPoint', options: {lean: true}})
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

router.post('/videos/liked', function (req, res, next) {
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
            console.log(user.videosLiked);
            var perPage = req.query.limit;
            var page = req.query.page;
            Video
                .find({_id: {$in: user.videosLiked}})
                .sort({createdAt: 'desc'})
                .skip(perPage * page)
                .limit(perPage)
                .populate({path: 'userObject', select: 'name fbId gender popiPoint', options: {lean: true}})
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

router.post('/follow', function (req, res, next) {
    var follower = req.body.follower;
    var followee = req.body.followee;

    async.seq(
        function (cb) {
            User.findOne({fbId: follower}, function (err, follower) {
                if (err) {
                    return res.status(400).send({err: 'Takip eden Kullanıcı bulunamadı'});
                }
                cb(null, follower);
            });
        },
        function (follower, cb) {
            User.findOne({fbId: followee}, function (err, followee) {
                if (err) {
                    return res.status(400).send({err: 'Takip edilen Kullanıcı bulunamadı'});
                }
                cb(null, follower, followee);
            });
        },
        function (follower, followee, cb) {
            User.update(
                {fbId: follower.fbId},
                {$addToSet: {followees: followee._id}},
                function (err, data) {
                    cb(null, follower, followee);
                }
            );
        },
        function (follower, followee, cb) {
            User.update(
                {fbId: followee.fbId},
                {$addToSet: {followers: follower._id}},
                function (err, data) {
                    cb(null, follower, followee);
                }
            );
        }
    )(function (err, follower, followee) {
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            sendNotification(follower, followee, 'follow');
            res.json({status: 'success', message: 'Follow', data: {follower: follower, followee: followee}});
        }
        return res;
    });
});

router.post('/unfollow', function (req, res, next) {
    var follower = req.body.follower;
    var followee = req.body.followee;

    async.seq(
        function (cb) {
            User.findOne({fbId: follower}, function (err, follower) {
                if (err) {
                    return res.status(400).send({err: 'Takip eden Kullanıcı bulunamadı'});
                }
                cb(null, follower);
            });
        },
        function (follower, cb) {
            User.findOne({fbId: followee}, function (err, followee) {
                if (err) {
                    return res.status(400).send({err: 'Takip edilen Kullanıcı bulunamadı'});
                }
                cb(null, follower, followee);
            });
        },
        function (follower, followee, cb) {
            User.update(
                {fbId: follower.fbId},
                {$pull: {followees: followee._id}},
                function (err, data) {
                    cb(null, follower, followee);
                }
            );
        },
        function (follower, followee, cb) {
            User.update(
                {fbId: followee.fbId},
                {$pull: {followers: follower._id}},
                function (err, data) {
                    cb(null, follower, followee);
                }
            );
        }
    )(function (err, follower, followee) {
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            sendNotification(follower, followee, 'unfollow');
            res.json({status: 'success', message: 'Follow', data: {follower: follower, followee: followee}});
        }
        return res;
    });
});

router.post('/videos', function (req, res, next) {
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
            Video
                .find({user: user.fbId, isDeleted: false})
                .sort({createdAt: 'desc'})
                .skip(perPage * page)
                .limit(perPage)
                .populate({path: 'userObject', select: 'name fbId gender popiPoint', options: {lean: true}})
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

router.post('/followers', function (req, res, next) {
    var user = req.body.user;
    User
        .findOne({fbId: user})
        .populate('followers')
        .exec(function (err, user) {
            if (err || !user) {
                return res.status(400).send({err: 'Kullanıcı bulunamadı'});
            }
            res.json({status: 'success', message: 'Takipçiler', count: user.followers.length, data: user.followers});
        });
});

router.post('/followees', function (req, res, next) {
    var user = req.body.user;

    User
        .findOne({fbId: user})
        .populate('followees')
        .exec(function (err, user) {
            if (err || !user) {
                return res.status(400).send({err: 'Kullanıcı bulunamadı'});
            }
            res.json({status: 'success', message: 'Takip Edenler', count: user.followees.length, data: user.followees});
        });
});

var sendNotification = function (follower, followee, type) {
    var interaction = new Interaction();
    var typeNo;
    if (type === 'follow') {
        typeNo = 9;
        fcm.sendNotification(followee.firebaseToken, '🎊 🎉 Wohooo yeni takipçi +1', follower.name + ' seni takip etmeye başladı');
    } else {
        typeNo = 10;
        fcm.sendNotification(followee.firebaseToken, '💔☹️ Bizden duymuş olma', follower.name + ' seni takip etmeyi bıraktı');
    }

    var key = interactionsReference.push().key;
    var interactionObj = interaction.toObject();
    interactionObj.type = typeNo;
    interactionObj.fbId = key;
    interactionObj.user = follower.fbId;
    interactionObj.whose = followee.fbId;
    delete interactionObj._id;
    interactionsReference.child(key).set(interactionObj);
    usersReference.child(followee.fbId).child('unread').transaction(function (current) {
        return (current || 0) + 1;
    });
};

module.exports = router;
