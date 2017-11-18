var CronJob = require('cron').CronJob;
var async = require('async');

var Game = require('../models/Game');
var Transaction = require('../models/Transaction');
var PlayerController = require('../controllers/players');
var GameController = require('../controllers/games');
var GameStates = require('./GameStates');

// TODO: execute every minute
const clockDuration = 20;
const cronExpression = '*/' + String(clockDuration) + ' * * * * *';

// games which are in progress
var ongoingGames = {};

// stores games which are pending for players to join
var gameRequests = {};
var totalGames = 0;

// global clock counter
// genesis is 16 Nov 2017, 16:20.5 GMT
var genesis = new Date(1510849205000);
var currentTime = new Date();
var diffInSeconds = (currentTime.getTime() - genesis.getTime()) / 1000;
var clock = Math.ceil(diffInSeconds / clockDuration);

// TODO: intialise clock on log homepage when server starts

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
    // TODO: Validate transaction_id and player_id
};

/**
 * Expected fields in transaction: min_bid_value, player_id
 * @param {Object} transaction
 */
function activateNewGame(transaction) {
    console.log("activating game.");
    const minBidValue = parseInt(transaction.min_bid_value);
    const playerId = parseInt(transaction.player_id);

    GameController.activateNewGame(minBidValue, clock, function(err, game) {
        if (err) console.error(err);
        else {
            console.log("Initialised new game: " + game.id + ", minBid: " + game.min_bid_value);
        }
    });
}

// Temporary function to populate players collection
function populatePlayersCollection() {
    var i = 3;
    while (i > 0) {
        PlayerController.createPlayer(function(err, player) {
            console.log(player);
        });
        i--;
    }
};
//populatePlayersCollection();

/**
 * Expected fields in transaction: game_id, player_id
 * @param {Object} transaction
 */
function joinNewGame(transaction) {
    const gameId = parseInt(transaction.game_id);
    var playerId = parseInt(transaction.player_id);

    GameController.getGame(gameId, function(err, game) {
        if (err) console.error(err);

        if (game.state == GameStates.ACTIVATE) {
            // Check player's balance before adding them to the game
            PlayerController.getPlayerBalance(playerId, function(err, playerBalance) {
                if (err) console.error(err);
                else {
                    if (playerBalance < game.min_bid_value) {
                        console.log("Player " + playerId + " has insufficient funds to join game " + game.id);
                    } else {
                        GameController.addPlayerToGame(gameId, playerId, function(err, updatedGame) {
                            // TODO: might need to io.emit
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("Player " + playerId + " has joined game " + gameId);
                            }
                        });
                    }
                }
            });
        } else {
            console.log("Player " + playerId + " tried to join " + gameId + ". But, the game is in state " +
                game.state);
        }
    });
}

/**
 * Expected fields in transaction: game_id, player_id, commit_secret, commit_guess, bid_value
 * @param {Object} transaction
 */
function gameRegister(transaction) {
    const gameId = parseInt(transaction.game_id);
    const playerId = parseInt(transaction.player_id);
    const commitSecret = transaction.commit_secret;
    const commitGuess = transaction.commit_guess;
    const bidValue = parseInt(transaction.bid_value);

    // Check if player's balance is greater than or equal to the bidValue
    PlayerController.getPlayerBalance(playerId, function(err, playerBalance) {
        if (err) console.error(err);
        else {
            if (playerBalance < bidValue) console.log("Player " + playerId + " has insufficient funds to place this bid");
            else {
                GameController.gameRegister(gameId, playerId, commitSecret, commitGuess, bidValue, function(err) {
                    if (err) console.error(err);
                    else {
                        const newBalance = playerBalance - bidValue;
                        PlayerController.updatePlayerBalance(playerId, newBalance, function(err, player) {
                            if (err) console.error(err);
                            else console.log("Player " + playerId + "'s new balance is: " + newBalance);
                        });
                        console.log("Player " + playerId + " has registered game successfully.");
                    }
                });
            }
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
    const secret = parseInt(transaction.secret);
    const guess = parseInt(transaction.guess);
    const rOne = parseInt(transaction.r_one);
    const rTwo = parseInt(transaction.r_two);

    GameController.revealSecret(gameId, playerId, secret, guess, rOne, rTwo, function(err) {
        if (err) console.error(err);
        else console.log("Player " + playerId + " has revealed secret.");
    });
}

/**
 * Expected fields in transaction: game_id
 * @param {Object} transaction
 */
function killGame(transaction) {
    const gameId = transaction.game_id;

    GameController.killGame(gameId, function(err, msg) {
        if (err) console.error(err);
        else console.log(msg);
    });
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
            // TODO: Not yet supported using DB
            // console.log("DISTRIBUTE");
            // distribute(transaction);
            break;
        default:
            break;
    }

    transaction.completed = true;
    transaction.save(function(err, updatedTransaction) {
        if (err) console.log(err);
        // TODO: io.emit to update the log
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
            // in every time block, we execute all pending transactions in the queue
            // TODO: If a current transaction does not belong to the state yet, we put it back into the queue
            // Invalid transactions can be removed such as join game when game is in middle of gameregister state
            var transactionQueue;
            Transaction.find({ completed: false }, function(err, transactions) {
                if (!err) {
                    transactionQueue = transactions;

                    // TODO: This must be done synchronously
                    while (transactionQueue.length > 0) {
                        const lengthOfQueue = transactionQueue.length;
                        const randomIndex = getRandomInt(0, lengthOfQueue - 1);

                        // serve transaction
                        console.log("Executing transaction:");
                        console.log(transactionQueue[randomIndex]);

                        executeTransaction(transactionQueue[randomIndex]);

                        transactionQueue.splice(randomIndex, 1);
                    }

                    callback(null);
                }
            });
        },
        function(callback) {
            // check on all pending game requests to see if enough players have joined
            Game.find({ state: { $eq: GameStates.PLAYERS_JOIN } }, function(err, gameRequests) {
                if (err) console.error(err);

                gameRequests.forEach(function(game) {
                    console.log(game);

                    // if the previous state was to join game, we check if sufficient players have joined
                    console.log("Checking Join Game");

                    console.log("Checking on game:\n" + game);
                    console.log("Number of players: " + game.players.length);

                    if (game.players.length < 3) {
                        console.log("Game has fewer than 3 players. Killing game.");
                        // initiate transaction to kill game
                        addNewTransaction({
                            "transaction_id": transactionTypes.KILLGAME,
                            "game_id": game.id
                        }, function(err) {
                            if (err) {
                                console.log("Some error. :/");
                            }
                        });
                    } else {
                        game.state = GameStates.GAME_START;
                        game.save(function(err, updatedGame) {
                            if (err) console.error(err);
                            else {
                                console.log("Game starting.");
                            }
                        });
                    }
                });

                callback(null);
            });
        },
        function(callback) {
            Game.find({ state: { $gte: GameStates.ACTIVATE, $lt: GameStates.COMPLETED, $ne: GameStates.GAME_KILLED } }, function(err, ongoingGames) {
                if (err) console.error(err);

                ongoingGames.forEach(function(game) {
                    game.state += 1;
                    game.save(function(err, updatedGame) {
                        if (err) console.error(err);
                    });
                });
            });
            callback(null);
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