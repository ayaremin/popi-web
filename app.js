var express = require('express');
var vhost = require('vhost');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('client-sessions');

var index = require('./routes/index');
var users = require('./routes/user');
var admin = require('./routes/admin');
var video = require('./routes/video');

var app = express();

var mongoose = require('mongoose');

mongoose.connect('mongodb://104.236.87.130:27017/popiDatabase');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
    cookieName: 'session',
    secret: 'eminayarbusraayarbasakayar',
    duration:  24 * 60 * 60 * 1000,
    activeDuration: 30 * 60 * 1000,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !true }
}));

app.use(logger('dev'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));


app.use('/', index);
app.use('/users', users);
app.use('/admin', admin);
app.use('/video', video);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
