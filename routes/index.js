var express = require('express');
var router = express.Router();

var cronMaster = require('../util/CronMaster');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

/**
 * Expected params:
 */
router.post('/send-transaction', function(req, res, next) {
    res.render('index', { title: 'Express' });
    // TODO: validate that the request has the (correct) transaction_id and player_id fields
    cronMaster.addNewTransaction(req.body, function(err) {
        if (err) {
            console.err("Error occurred when adding new transaction");
        } else {
            console.log("Added new transaction successfully");
        }
    });
});

module.exports = router;