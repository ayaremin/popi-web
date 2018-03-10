var express = require('express');
var router = express.Router();
var async = require('async');
var Interaction = require('../models/interaction');

router.post('/interactions', function (req, res, next) {
  var interaction = req.body.interaction;
  var user = req.body.user;

  Interaction
      .find ({})
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
