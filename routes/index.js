var express = require('express');
var router = express.Router();

var cronMaster = require('../util/CronMaster');

var transactionTypes = {
    ACTIVATE: 0,
    JOINGAME: 1,
    KILLGAME: 2,
    STARTGAME: 3,
    GAMEREGISTER: 4,
    REVEALSECRET: 5,
    DISTRIBUTE: 6
};

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

/**
 * Expected params:
 */
router.post('/send-transaction', function(req, res, next) {
    res.render('index', { title: 'Express' });
    console.log(req.body);

    const transaction = {
        "transactionType": transactionTypes.ACTIVATE,
        "minBidValue": req.body["min_bid_value"]
    };

    cronMaster.addNewTransaction(transaction, function(err) {
        if (err) {
            console.err("Error occurred when adding new transaction");
        } else {
            console.log("Added new transaction successfully");
        }
    });
});

module.exports = router;