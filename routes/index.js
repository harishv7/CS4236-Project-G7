var express = require('express');
var router = express.Router();

var cronMaster = require('../util/CronMaster');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/client', function(req, res, next) {
    res.render('client');
});

router.post('/send-transaction', function(req, res, next) {
    cronMaster.addNewTransaction(req.body, function(err) {
        if (err) {
            console.err("Error occurred when adding new transaction");
            res.sendStatus(500);
        } else {
            console.log("Added new transaction successfully");
            res.sendStatus(200);
        }
    });
});

module.exports = router;