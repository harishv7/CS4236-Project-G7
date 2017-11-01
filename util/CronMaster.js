var CronJob = require('cron').CronJob;

// execute every minute
var cronExpression = '*/10 * * * * *';

// array containing all transactions to be served
var transactionQueue = [];

// global clock
var clock = 0;

// Returns a random integer between min (included) and max (included)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var addNewTransaction = function(transaction) {
    transactionQueue.unshift(transaction);
    console.log("Current transaction queue: ");
    console.log(transactionQueue);
};

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