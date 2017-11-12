var CronJob = require('cron').CronJob;
var Game = require('./Game');
var GameStates = require('./GameStates');
var async = require('async');

// execute every minute
const cronExpression = '*/20 * * * * *';

// array containing all transactions to be served
var transactionQueue = [];

var ongoingGames = {};
var gameRequests = {};
var totalGames = 0;

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
    transactionQueue.unshift(transaction);
    console.log("Current transaction queue: ");
    console.log(transactionQueue);
    io.emit('newTransaction', transaction);
    callback(null);
};

function activateNewGame(transaction) {
    console.log("activating game.");
    const minBidValue = parseInt(transaction.min_bid_value);
    // TODO: do we need to check the initiator's balance?
    const playerBalance = parseInt(transaction.player_balance);

    // create new Game with the minBidValue
    const newGameId = ++totalGames;
    var newGame = new Game(newGameId, minBidValue);
    gameRequests[newGameId] = newGame;
}

function joinNewGame(transaction) {
    const gameId = parseInt(transaction.game_id);
    const playerId = parseInt(transaction.player_id);
    const playerBalance = parseInt(transaction.player_balance);

    if (gameId in gameRequests) {
        const game = gameRequests[gameId];
        game.addNewPlayer(playerId, playerBalance, function(err) {
            if (err) {
                console.error(err);
            } else {
                console.log(playerId + " has joined " + gameId);
            }
        });
    }
}

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
        default:
            break;
    }
}

var cronJob = new CronJob(cronExpression, function() {
    // increment clock
    clock += 1;
    console.log("Clock: " + clock);

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
                        delete gameRequests[gameId];
                    } else {
                        console.log("Game starting.");
                        // increment game phase, move game into ongoing games
                        game.incrementGameState();
                        ongoingGames[gameId] = game;
                        delete gameRequests[gameId];
                    }
                }
            }

            callback(null);
        },
        function(callback) {
            // TODO: increment game state of all games - both ongoing and pending
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
    ]);
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