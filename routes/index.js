var express = require('express');
var router = express.Router();

var Transaction = require('../models/Transaction');
var Game = require('../models/Game');
var async = require('async');

var cronMaster = require('../util/CronMaster');

var gameStates = {
    0: "Activate",
    1: "Players Join",
    2: "Game Killed",
    3: "Game Start",
    4: "Game Register",
    5: "Reveal Secret",
    6: "Distribute",
    7: "Complete"
};

function populateTransactionInfo(transaction, callback) {
    const completed = transaction.completed;
    var transactionInfo = {};
    transactionInfo["playerId"] = transaction.player_id;

    switch (parseInt(transaction.transaction_id)) {
        case 0:
            transactionInfo["transactionType"] = "Activate";
            transactionInfo["parameters"] = [
                "Minimum Bid Value: " + transaction.min_bid_value
            ];
            break;
        case 1:
            transactionInfo["transactionType"] = "Join Game";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id
            ]
            break;
        case 2:
            transactionInfo["transactionType"] = "Kill Game";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id
            ];
            break;
        case 3:
            transactionInfo["transactionType"] = "Start Game";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id
            ];
            break;
        case 4:
            transactionInfo["transactionType"] = "Game Register";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id,
                "Commit Secret: " + transaction.commit_secret,
                "Commit Guess: " + transaction.commit_guess,
                "Bid Value: " + transaction.bid_value
            ];
            break;
        case 5:
            transactionInfo["transactionType"] = "Reveal Secret";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id,
                "Secret: " + transaction.secret,
                "Guess: " + transaction.guess,
                "R1: " + transaction.r_one,
                "R2: " + transaction.r_two
            ];
            break;
        case 6:
            transactionInfo["transactionType"] = "Distribute";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id
            ];
            break
        case 7:
            transactionInfo["transactionType"] = "Complete";
            transactionInfo["parameters"] = [
                "Game ID: " + transaction.game_id
            ];
            break
        default:
            break;
    }
    callback(null, completed, transactionInfo);
}

/* GET home page. */
router.get('/', function(req, res, next) {
    Transaction.find({}, function(err, transactions) {
        if (err) console.error(err);

        Game.find({}, function(err, games) {
            if (err) console.error(err);
            // process retrived documents into required format
            // transactions
            var currentQueue = [];
            var archive = [];
            var allGames = [];
            async.each(transactions, function(transaction, callback) {
                populateTransactionInfo(transaction, function(err, completed, transactionInfo) {
                    if (err) {
                        console.error("Error!");
                    } else {
                        if (completed !== "true") {
                            archive.push(transactionInfo);
                        } else {
                            currentQueue.push(transactionInfo);
                        }
                        callback();
                    }
                });
            }, function(err) {
                if (err) {
                    console.error("Error when looping through transactions.");
                } else {
                    async.each(games, function(game, callback) {
                        gameInfo = {};
                        gameInfo["gameId"] = game.id;
                        gameInfo["gameState"] = gameStates[parseInt(game.state)];
                        allGames.push(gameInfo);

                        if (parseInt(game.state) === 7) {
                            gameInfo["winners"] = game.winners;
                            if (game.winning_cup) {
                                gameInfo["winningCupLocation"] = "Winning Cup Location: " + game.winning_cup;
                            }
                        }

                        callback();
                    }, function(err) {
                        res.render('index', { title: 'The CupShufflers', currentQueue: currentQueue, completed: archive, games: allGames });
                    });
                }
            });
        });
    });
});

router.get('/client', function(req, res, next) {
    res.render('client');
});

router.post('/send-transaction', function(req, res, next) {
    var newTransaction = new Transaction(req.body);

    // save to db
    newTransaction.save(function(err, updatedTransaction) {
        if (err) {
            console.error(err);
        } else {
            console.log("Added to transaction queue: ");
            console.log(newTransaction);

            populateTransactionInfo(updatedTransaction, function(err, completed, transactionInfo) {
                if (transactionInfo["playerId"] == null) {
                    transactionInfo["playerId"] = "Broker";
                }
                console.log(transactionInfo);
                io.emit("newTransaction", transactionInfo);
            });
        }
        res.sendStatus(200);
    });

});

module.exports = router;