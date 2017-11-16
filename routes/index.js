var express = require('express');
var router = express.Router();

var Transaction = require('../models/Transaction');

var cronMaster = require('../util/CronMaster');

/* GET home page. */
router.get('/', function(req, res, next) {
    Transaction.find({}, function(err, transactions) {
        if (!err) {
            res.render('index', { title: 'The CupShufflers', transactions: transactions});
        }
    });
});

router.get('/client', function(req, res, next) {
    res.render('client');
});

router.post('/send-transaction', function(req, res, next) {
    // TODO: validate that the request has the (correct) transaction_id and player_id fields
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