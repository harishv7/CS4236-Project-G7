var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/activate', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/join-game', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/game-register', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/reveal-secret', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;