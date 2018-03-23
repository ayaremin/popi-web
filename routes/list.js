var express = require('express');
var async = require('async');
var Interaction = require('../models/interaction');
var User = require('../models/user');
var path = require('path');
var moment = require('moment');
var _ = require('lodash');
var fs = require('fs');

var router = express.Router();
var mongoose = require('mongoose');

mongoose.connect(process.env.POPIDB);

router.post('/overall', function (req, res, next) {
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
            User
                .find({fbId: {$nin:['000000']}})
                .select('name popiPoint fbId profilePicture')
                .sort({popiPoint: 'desc'})
                .lean()
                .limit (3)
                .exec (function (err, users) {
                    if (err) {
                        console.log(err);
                        return res.status(400).send({err: 'Kullanıcılar bulunamadı'});
                    }
                    cb(null, users);
                });
        }
    )(function (err, data) {
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            res.json({status: 'success', message: 'Kullanıcılar', count: data.length, data: data});
        }
        return res;
    });
});

router.post('/overall/day/:range', function (req, res, next) {
    var user = req.body.user;
    var range = req.params.range;
    var perPage = 50;
    var page = req.query.page;
    var now = moment().startOf('day');
    var date = now.subtract(range, 'day').toDate();
    async.seq(
        function (cb) {
            User.findOne({fbId: user}, function (err, user) {
                if (err) {
                    return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                }
                cb(null, user);
            });
        },
        function (user, cb) {
            var query = {
                whose: {$nin: ['000000']},
                $or: [{type: 2}, {type: 3}],
                createdAt: {$gte: date}
            };

            Interaction
                .distinct('whose', query)
                .select()
                .lean()
                .exec (function (err, interactions) {
                    if (err) {
                        return res.status(400).send({err: 'Etkileşimler bulunamadı'});
                    }
                    cb(null, interactions);
                });
        },
        function (interactions, cb) {
            var users = [];

            async.each(interactions, function(interaction, callback){
                var queryLike = {
                    type: 2,
                    createdAt: {$gte: date},
                    whose: interaction
                };

                var queryDislike = {
                    type: 3,
                    createdAt: {$gte: date},
                    whose: interaction
                };

                User
                    .findOne({fbId: interaction})
                    .select('name profilePicture popiPoint fbId')
                    .exec(function (err, user) {
                        if (err || !user) {
                            return res.status(400).send({err: 'Kullanıcı bulunamadı'});
                        }
                        user.popiPoint = 0;
                        Interaction
                            .distinct('_id', queryLike)
                            .select()
                            .lean()
                            .exec (function (err, interactions) {
                                user.popiPoint += interactions.length;
                                Interaction
                                    .distinct('_id', queryDislike)
                                    .select()
                                    .lean()
                                    .exec(function (err, results) {
                                        user.popiPoint -= results.length;
                                        users.push(user);
                                        callback();
                                    });
                            });
                    });
            }, function (err) {
                cb (err, users);
            });
        }
    )(function (err, data) {
        if (err) {
            console.error(err);
            res.json({status: 'error', message: err.message});
        } else {
            res.json({status: 'success', message: 'Etkileşimler', count: data.length, data: _.orderBy(data, [function (user) {
                return -1*user.popiPoint;
            }])});
        }
        return res;
    });
});

module.exports = router;
