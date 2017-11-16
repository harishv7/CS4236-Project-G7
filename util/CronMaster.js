var CronJob = require('cron').CronJob;
var Game = require('./Game');
var Transaction = require('../models/Transaction');
var GameStates = require('./GameStates');
var async = require('async');

// TODO: execute every minute
const cronExpression = '*/20 * * * * *';

// games which are in progress
var ongoingGames = {};

// stores games which are pending for players to join
var gameRequests = {};
var totalGames = 0;

// global clock counter
var clock = 0;

// transaction codes
var transactionTypes = {
    ACTIVATE: 0,
    JOINGAME: 1,
    KILLGAME: 2, // issued by broker
    STARTGAME: 3,
    GAMEREGISTER: 4,
    REVEALSECRET: 5,
    DISTRIBUTE: 6 // issued by broker
};

// Returns a random integer between min (included) and max (included)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Adds new transaction into the queue
 * @param {Object} transaction
 * @param {*} callback 
 */
var addNewTransaction = function(transaction, callback) {
    var newTransaction = new Transaction({
        transaction_id: transaction.transaction_id,
        player_id: transaction.player_id,
        completed: false
    });
    newTransaction.save(function(err, updatedTransaction) {
        if (err) callback("Error when saving a Transaction document");
        io.emit('newTransaction', updatedTransaction);
    });
    Transaction.find({}, function(err, transactions) {
        if (!err) {
            transactionQueue = transactions;
            console.log("Current transaction queue: ");
            console.log(transactionQueue);
            callback(null);
        }
    });
};

/**
 * Expected fields in transaction: min_bid_value, player_id
 * @param {Object} transaction 
 */
function activateNewGame(transaction) {
    console.log("activating game.");
    const minBidValue = parseInt(transaction.min_bid_amt);
    const playerId = parseInt(transaction.player_id)

    // create new Game with the minBidValue
    const newGameId = ++totalGames;
    var newGame = new Game(newGameId, minBidValue);
    gameRequests[newGameId] = newGame;
}

/**
 * Expected fields in transaction: game_id, player_id
 * @param {Object} transaction 
 */
function joinNewGame(transaction) {
    const gameId = parseInt(transaction.game_id);
    const playerId = parseInt(transaction.player_id);

    if (gameId in gameRequests) {
        const game = gameRequests[gameId];
        game.addNewPlayer(playerId, function(err) {
            if (err) {
                console.error(err);
            } else {
                console.log(playerId + " has joined " + gameId);
            }
        });
    }
}

/**
 * Expected fields in transaction: game_id, player_id, commit_secret, commit_guess
 * @param {Object} transaction 
 */
function gameRegister(transaction) {
    const gameId = parseInt(transaction.game_id);
    const playerId = parseInt(transaction.player_id);
    const commitGuess = transaction.commit_guess;
    const commitSecret = transaction.commit_secret;
    const bidValue = transaction.bid_value;

    var game = ongoingGames[gameId];
    game.gameRegister(playerId, commitGuess, commitSecret, bidValue, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Player " + playerId + " has registered game successfully.");
        }
    });
}

/**
 * Expected fields in transaction: game_id, player_id, secret, guess, r_one, r_two
 * @param {Object} transaction 
 */
function revealSecret(transaction) {
    const gameId = parseInt(transaction.game_id);
    const playerId = parseInt(transaction.player_id);
    const secret = transaction.secret;
    const guess = transaction.guess;
    const rOne = transaction.r_one;
    const rTwo = transaction.r_two;

    var game = ongoingGames[gameId];
    game.revealSecret(playerId, secret, guess, rOne, rTwo, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Player " + playerId + " has revealed secret.");
        }
    });
}

/**
 * Expected fields in transaction: game_id
 * @param {Object} transaction 
 */
function killGame(transaction) {
    const gameId = transaction.game_id;
    delete gameRequests[gameId];
}

function distribute(transaction) {
    const gameId = transaction.game_id;
    var game = ongoingGames[gameId];
    game.distribute(function(err) {
        // TODO: callback should receiving winner details etc.
        // TODO: publish these details to the log homepage
    });
}

/**
 * Calls the necessary function execute based on the transaction id
 * @param {Object} transaction 
 */
function executeTransaction(transaction) {
    const transactionId = parseInt(transaction.transaction_id);
    console.log(transactionId);

    switch (transactionId) {
        case transactionTypes.ACTIVATE:
            console.log("ACTIVATE");
            activateNewGame(transaction);
            break;
        case transactionTypes.JOINGAME:
            console.log("JOIN GAME");
            joinNewGame(transaction);
            break;
        case transactionTypes.KILLGAME:
            console.log("KILL GAME");
            killGame(transaction);
            break;
        case transactionTypes.GAMEREGISTER:
            console.log("GAME REGISTER");
            gameRegister(transaction);
            break;
        case transactionTypes.REVEALSECRET:
            console.log("REVEAL SECRET");
            revealSecret(transaction);
            break;
        case transactionTypes.DISTRIBUTE:
            console.log("DISTRIBUTE");
            distribute(transaction);
            break;
        default:
            break;
    }

    transaction.completed = true;
    transaction.save(function(err, updatedTransaction) {
        if (err) console.log(err);
    });
}

/**
 * A cronjob which simulates the clock for the PTC
 */
var cronJob = new CronJob(cronExpression, function() {
    // increment clock
    clock += 1;
    console.log("Clock: " + clock);
    io.emit('clock', clock);

    async.series([
        function(callback) {
            // check on all pending game requests to see if enough players have joined
            for (var gameId in gameRequests) {
                console.log(gameId);
                const game = gameRequests[gameId];
                console.log(game);
                const gameState = parseInt(game.gameState);

                console.log("Game state: " + gameState);
                console.log(GameStates.JOINGAME);

                // if the previous state was to join game, we check if sufficient players have joined
                if (gameState === 1) {
                    console.log("Checking Join Game");
                    console.log(gameRequests);

                    console.log("Checking on game id: " + gameId);
                    console.log("Number of players: " + game.numOfPlayers);

                    if (game.numOfPlayers < 3) {
                        console.log("Game has fewer than 3 players. Killing game.");
                        // initiate transaction to kill game
                        addNewTransaction({
                            "transaction_id": transactionTypes.KILLGAME,
                            "game_id": gameId
                        }, function(err) {
                            if (err) {
                                console.log("Some error. :/");
                            }
                        });
                    } else {
                        console.log("Game starting.");
                        // move game into ongoing games, delete from gameRequests
                        ongoingGames[gameId] = game;
                        delete gameRequests[gameId];
                    }
                }
            }

            callback(null);
        },
        function(callback) {
            for (var gameId in ongoingGames) {
                ongoingGames[gameId].incrementGameState();
            }

            for (var gameId in gameRequests) {
                gameRequests[gameId].incrementGameState();
            }

            callback(null);
        },
        function(callback) {
            // in every time block, we execute all pending transactions in the queue
            // Comment: [Teddy] I'm not sure if I'm doing it right... But when I code in NodeJS this is what always
            // happen... Things are deeply nested. Leave me any suggestions if you have
            var transactionQueue;
            Transaction.find({completed: false}, function(err, transactions) {
                if (!err) {
                    transactionQueue = transactions;

                    while (transactionQueue.length > 0) {
                        const lengthOfQueue = transactionQueue.length;
                        const randomIndex = getRandomInt(0, lengthOfQueue - 1);

                        // serve transaction
                        console.log("Executing transaction:");
                        console.log(transactionQueue[randomIndex]);

                        executeTransaction(transactionQueue[randomIndex]);
                    }

                    callback(null);
                }
            });
        }
    ]);
}, function() {
    // executed when cronjob is stopped
    console.log("Cronjob stopped.");
}, false, 'America/Los_Angeles');

var startCronjob = function() {
    console.log("Starting cron job.");
    cronJob.start();
};

module.exports = {
    startCronjob,
    addNewTransaction
};