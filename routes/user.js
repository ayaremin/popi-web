var express = require('express');
var router = express.Router();
var async = require('async');
var Interaction = require('../models/interaction');

router.post('/interactions', function (req, res, next) {
    var perPage = 50;
    var page = req.query.page;
    var user = req.body.user;

    var query = {
        whose: user,
        $or: [{type: 2}, {type: 3}]
    };
    console.log(query);
    Interaction
        .find(query)
        .lean()
        .populate ({path: 'video', select: 'title'},{path: 'video', select: 'title'})
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
