var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cronMaster = require('./util/CronMaster');
var dbManager = require('./DBManager');

var index = require('./routes/index');

var Player = require('./models/Player');
var Game = require('./models/Game');
var Transaction = require('./models/Transaction');

var app = express();

// socket
var server = require('http').createServer(app);
global.io = require('socket.io')(server);

server.listen(3000);

io.on('connect', onConnect);

function onConnect(socket) {
    console.log("Socket Connected.");
    socket.emit('hello', 'can you hear me?', 1, 2, 'abc');
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

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

// start clock
cronMaster.startCronjob();

module.exports = {
    app
};
