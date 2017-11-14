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

/**
 * Expected params:
 */
router.post('/send-transaction', function(req, res, next) {
    res.render('index', { title: 'Express' });

    cronMaster.addNewTransaction(req.body, function(err) {
        if (err) {
            console.err("Error occurred when adding new transaction");
        } else {
            console.log("Added new transaction successfully");
        }
    });
});

module.exports = router;