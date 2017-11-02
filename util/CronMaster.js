var CronJob = require('cron').CronJob;

// execute every minute
const cronExpression = '*/30 * * * * *';

// array containing all transactions to be served
var transactionQueue = [];

// global clock
var clock = 0;

// transaction codes
var transactionTypes = {
    ACTIVATE: 0,
    JOINGAME: 1,
    KILLGAME: 2,
    STARTGAME: 3,
    GAMEREGISTER: 4,
    REVEALSECRET: 5,
    DISTRIBUTE: 6
};

// Returns a random integer between min (included) and max (included)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var addNewTransaction = function(transaction, callback) {
    // io.emit('init', [1, 2, 3]);
    transactionQueue.unshift(transaction);
    console.log("Current transaction queue: ");
    console.log(transactionQueue);
    io.emit('newTransaction', transaction);
    callback(null);
};

function executeTransaction(transaction) {
    const transactionId = transaction.transaction_id;
    switch (transactionId) {
        case transactionTypes.ACTIVATE:
            const minBidValue = transaction.min_bid_value;
        case transactionTypes.JOINGAME:
            const gameId = transaction.game_id;
        case transactionTypes.GAMEREGISTER:
            const commitSecret = transaction.commit_secret;
            const commitGuess = transaction.commit_guess;
            const bidAmt = transaction.value;
    }
}

var cronJob = new CronJob(cronExpression, function() {
    // retrieve a transaction from the queue and serve
    // increment clock
    clock += 1;
    console.log("Clock: " + clock);

    if (transactionQueue.length > 0) {
        const lengthOfQueue = transactionQueue.length;
        const randomIndex = getRandomInt(0, lengthOfQueue - 1);

        // serve transaction
        console.log("Executing transaction:");
        console.log(transactionQueue[randomIndex]);

        // TODO: Logic for executing transactions
        executeTransaction(transactionQueue[randomIndex]);

        transactionQueue.splice(randomIndex, 1);
    } else {
        console.log("No transactions to execute.");
    }
}, function() {
    // executed when cronjob is stopped
    console.log("Cronjob stopped.");
}, false, 'America/Los_Angeles');

var startCronjob = function() {
    console.log("Starting cron job.");
    cronJob.start();
}

module.exports = {
    startCronjob,
    addNewTransaction
};