var _ = require('lodash');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Game = require('./../models/Game');

var PlayerController = require('../controllers/players');
const BROKER_PERCENTAGE = 0.05;

var getGame = function(gameId, callback) {
    Game.findOne({id: gameId}).then(function(game) {
        if (!game) {
            return callback('Game not found');
        }
        return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var displayGames = function(req, res) {
    Game.find().then(function(games) {
        if (games.length == 0) {
            return res.status(404).send('No games found');
        }
        return res.send({games});
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var activateNewGame = function(minBidValue, startTime, callback) {
    let game = new Game({
        min_bid_value: minBidValue,
        start_time: startTime
    });

    game.save().then(function(game) {
        callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var addPlayer = function(gameId, playerId, callback) {
    Game.findOneAndUpdate({id: gameId}, {$push: {players: playerId}}, {new: true}).then(function(game) {
        if (!game) {
            return callback('Game does not exist');
        } else {
            return callback(null, game);
        }
    })
    .catch(function(err) {
        return callback(err);
    });
};

var gameRegister = function(req, res) {
    var body = _.pick(req.body, ['game_id', 'player_id', 'secret', 'guess', 'r_one', 'r_two']);
    var player_id = body.player_id;

    var temp = {};
    temp = {
        player_id: body.player_id,
        secret: body.secret,
        guess: body.guess,
        r_one: body.r_one,
        r_two: body.r_two
    };

    Game.findOneAndUpdate({id: body.game_id}, {$push: {game_register: temp}}, {new: true}).then(function(game) {
        if (!game) {
            return res.status(404).send('Game does not exist');
        } else {
            return res.send({game});
        }
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
}

var distribute = function(gameId, callback) {
    Game.findOne({id: gameId}).then(function(game) {
        // map the playerIds to gameRegisters and revealSecrets
        var playerIdToGameRegisters = {}, playerIdToRevealSecrets;
        game.game_registers.forEach(function(gameRegister) {
            playerIdToGameRegisters[gameRegister.player_id] = gameRegister;
        });
        game.reveal_secrets.forEach(function(revealSecret) {
            playerIdToRevealSecrets[revealSecret.player_id] = revealSecret;
        });

        /*
         * Distribute scheme:
         * 1. For each game register
         *      Find the corresponding reveal_secret
         *      If can't be found OR can't be opened correctly
         *      Register this player as a dishonest player
         * 2. If there's any dishonest player
         *      Distribute the pooled money to N honest users
         * 3. Otherwise
         *      Distribute the pooled money to the winners
         */
        var numOfPlayers = game.players.length,
            dishonestPlayers = [],
            totalBidValue = 0;
        for (var playerId in playerIdToGameRegisters) {
            if (!playerIdToRevealSecrets.hasOwnProperty(playerId)) {
                dishonestPlayers.push(playerId);
            } else {
                var thisGameRegister = playerIdToGameRegisters[playerId],
                    thisRevealSecret = playerIdToRevealSecrets[playerId];
                if (!canOpenCommitment(thisGameRegister, thisRevealSecret)) {
                    dishonestPlayers.push(playerId);
                }
            }
            totalBidValue += playerIdToGameRegisters[playerId].bid_value;
        }

        if (dishonestPlayers.length > 0) {
            var numOfHonestPlayers = numOfPlayers - dishonestPlayers.length,
                winningAmount = 0;
            for (var playerId in playerIdToGameRegisters) {
                var thisBidValue = playerIdToGameRegisters[playerId].bid_value;
                if (dishonestPlayers.include(playerId)) {
                    // Calculate the amount to be distributed equally
                    winningAmount += thisBidValue;
                } else {
                    // Each honest player gets back what they bid
                    PlayerController.addBalance(playerId, thisBidValue);
                }
            }

            winningAmount /= numOfHonestPlayers;
            for (var playerId in playerIdToGameRegisters) {
                if (!dishonestPlayers.include(playerId)) {
                    game.winners.push({player_id: playerId, win_value: winningAmount});
                    PlayerController.addBalance(playerId, winningAmount);
                }
            }

        } else {
            // Calculate the location of the coin, and map cup to the players betting on that cup
            var cupToPlayers = {},
                coinLocation = 0;
            for (var playerId in playerIdToRevealSecrets) {
                var thisRevealSecret = playerIdToRevealSecrets[playerId],
                    secret = thisRevealSecret.secret,
                    guess = thisRevealSecret.guess;
                coinLocation += secret;

                if (!cupToPlayers.hasOwnProperty(guess)) {
                    cupToPlayers[guess] = []
                }
                cupToPlayers[guess].push(playerId);
            }

            coinLocation = coinLocation % numOfPlayers;
            game.winning_cup = coinLocation;

            var totalWinningBidValue = 0;
            cupToPlayers[coinLocation].forEach(function(playerId) {
                var thisGameRegister = playerIdToGameRegisters[playerId];
                totalWinningBidValue += thisGameRegister.bid_value;
            });

            if (totalWinningBidValue > 0) {
                // If there are some winners
                cupToPlayers[coinLocation].forEach(function(playerId) {
                    var thisGameRegister = playerIdToGameRegisters[playerId],
                        thisBidValue = thisGameRegister.bid_value,
                        thisDebit = totalBidValue *  thisBidValue / totalWinningBidValue;
                    PlayerController.addBalance(playerId, thisDebit);
                    game.winners.push({player_id: playerId, win_value: thisDebit});
                });
            } else {
                // If there's no winner, broker take some percentage from the total bid value
                totalWinningBidValue = (1 - BROKER_PERCENTAGE) * totalBidValue;
                for (var playerId in playerIdToGameRegisters) {
                    var thisGameRegister = playerIdToGameRegisters[playerId],
                        thisBidValue = thisGameRegister.bid_value,
                        thisDebit = totalWinningBidValue *  thisBidValue / totalBidValue;
                    PlayerController.addBalance(playerId, thisDebit);
                }

                // TODO: transfer the percentage to broker
            }

        }

        game.save(function(err, updatedGame) {
           if (err) callback(err);
        });

        callback(null);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var canOpenCommitment = function(gameRegister, revealSecret) {
    var isSecretCommitValid, isGuessCommitValid;
    var hash1 = crypto.createHash('sha256'), hash2 = crypto.createHash('sha256');
    var computedSecretCommit = hash1.update(revealSecret.r_one).update(revealSecret.secret).digest(),
        computedGuessCommit = hash2.update(revealSecret.r_two).update(revealSecret.guess).digest();

    isSecretCommitValid = computedSecretCommit == gameRegister.secret_commit;
    isGuessCommitValid = computedGuessCommit == gameRegister.guess_commit;

    return isSecretCommitValid && isGuessCommitValid;
};

module.exports = {
    getGame,
    displayGames,
    activateNewGame,
    addPlayer,
    gameRegister,
    updateGameState,
    deleteGame
}
