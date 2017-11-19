var _ = require('lodash');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Game = require('./../models/Game');
var GameStates = require('./../util/GameStates');

var PlayerController = require('../controllers/players');
const BROKER_PERCENTAGE = 0.05;

var getGame = function(gameId, callback) {
    Game.findOne({id: gameId}).then(function(game) {
        if (!game) return callback("Game not found");
        else return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var activateNewGame = function(minBidValue, startTime, callback) {
    let game = new Game({
        min_bid_value: minBidValue,
        start_time: startTime
    });

    game.save().then(function(game) {
        return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var addPlayerToGame = function(gameId, playerId, callback) {
    Game.findOneAndUpdate({id: gameId}, {$push: {players: playerId}}, {new: true}).then(function(game) {
        if (!game) return callback("Game does not exist");
        else return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var gameRegister = function(gameId, playerId, commitSecret, commitGuess, bidValue, callback) {
    var temp = {
        player_id: playerId,
        commit_secret: commitSecret,
        commit_guess: commitGuess,
        bid_value: bidValue
    };

    //TODO: Handle condition where bid_value is less than the game's min_bid_value

    Game.findOneAndUpdate({id: gameId}, {$push: {game_registers: temp}}, {new: true}).then(function(game) {
        if (!game) return callback("Game does not exist");
        else return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var revealSecret = function(gameId, playerId, secret, guess, rOne, rTwo, callback) {
    var temp = {
        player_id: playerId,
        secret: secret,
        guess: guess,
        r_one: rOne,
        r_two: rTwo
    };

    Game.findOneAndUpdate({id: gameId}, {$push: {reveal_secrets: temp}}, {new: true}).then(function(game) {
        if (!game) return callback("Game does not exist");
        else return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var distribute = function(gameId, callback) {
    Game.findOne({id: gameId}).then(function(game) {
        console.log("Currently trying to distribute for game id: " + game.id);
        // map the playerIds to gameRegisters and revealSecrets
        var playerIdToGameRegisters = {}, playerIdToRevealSecrets = {};
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

        console.log("Calculated the total bid value: " + totalBidValue);
        if (dishonestPlayers.length > 0) {
            console.log("There is " + dishonestPlayers.length + " dishonest players. Shame on them");
            var numOfHonestPlayers = numOfPlayers - dishonestPlayers.length,
                winningAmount = 0;

            console.log("Refunding the bid values of honest players...");
            for (var playerId in playerIdToGameRegisters) {
                var thisBidValue = playerIdToGameRegisters[playerId].bid_value;
                if (dishonestPlayers.indexOf(playerId) > -1) {
                    // Calculate the amount to be distributed equally
                    winningAmount += thisBidValue;
                } else {
                    // Each honest player gets back what they bid
                    console.log("Player " + playerId + " gets back " + thisBidValue);
                    PlayerController.addBalance(playerId, thisBidValue);
                }
            }

            winningAmount /= numOfHonestPlayers;
            console.log("Splitting " + winningAmount + " to the honest players...");
            for (var playerId in playerIdToGameRegisters) {
                if (dishonestPlayers.indexOf(playerId) == -1) {  // if honest player
                    game.winners.push({player_id: playerId, win_value: winningAmount});
                    PlayerController.addBalance(playerId, winningAmount);
                    console.log("Player " + playerId + " gets " + winningAmount);
                }
            }

        } else {
            console.log("No dishonest player! :-)");
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
            console.log("The winning cup: " + coinLocation);
            console.log("The winners: " + cupToPlayers[coinLocation]);

            var totalWinningBidValue = 0;
            if (cupToPlayers[coinLocation]) {
                cupToPlayers[coinLocation].forEach(function(playerId) {
                    var thisGameRegister = playerIdToGameRegisters[playerId];
                    totalWinningBidValue += thisGameRegister.bid_value;
                });
            }

            if (totalWinningBidValue > 0) {
                // If there are some winners
                cupToPlayers[coinLocation].forEach(function(playerId) {
                    var thisGameRegister = playerIdToGameRegisters[playerId],
                        thisBidValue = thisGameRegister.bid_value,
                        thisDebit = totalBidValue *  thisBidValue / totalWinningBidValue;
                    PlayerController.addBalance(playerId, thisDebit);
                    game.winners.push({player_id: playerId, win_value: thisDebit - thisBidValue});
                    console.log("Player " + playerId + " gets " + thisDebit + ", wins " + (thisDebit - thisBidValue));
                });
            } else {
                // If there's no winner, broker take some percentage from the total bid value
                console.log("Nobody won!");
                totalWinningBidValue = (1 - BROKER_PERCENTAGE) * totalBidValue;
                for (var playerId in playerIdToGameRegisters) {
                    var thisGameRegister = playerIdToGameRegisters[playerId],
                        thisBidValue = thisGameRegister.bid_value,
                        thisDebit = totalWinningBidValue *  thisBidValue / totalBidValue;
                    PlayerController.addBalance(playerId, thisDebit);
                    console.log("Player " + playerId + " gets back " + thisDebit);
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
    var computedSecretCommit = hash1.update(String(revealSecret.r_one)).update(String(revealSecret.secret)).digest(),
        computedGuessCommit = hash2.update(String(revealSecret.r_two)).update(String(revealSecret.guess)).digest();

    computedSecretCommit = computedSecretCommit.toString('hex');
    computedGuessCommit = computedGuessCommit.toString('hex');

    isSecretCommitValid = computedSecretCommit == gameRegister.commit_secret;
    isGuessCommitValid = computedGuessCommit == gameRegister.commit_guess;

    return isSecretCommitValid && isGuessCommitValid;
};

var startGame = function(gameId, callback) {
    Game.findOne({ id: gameId }, function(err, game) {
        if (err) callback(err);

        if (game.state == GameStates.PLAYERS_JOIN) {
            game.state = GameStates.GAME_START;
            game.save(function(err, updatedGame) {
                if (err) callback(err);
                else callback(null, "Game " + gameId + " started.")
            });
        } else {
            callback("Tried to start game " + gameId + ". But, the game is in state" + GameStates[game.state]);
        }
    });
};

var killGame = function(gameId, callback) {
    Game.findOne({ id: gameId }, function(err, game) {
        if (err) callback(err);

        if (game.state == GameStates.PLAYERS_JOIN) {
            game.state = GameStates.GAME_KILLED;
            game.save(function(err, updatedGame) {
                if (err) callback(err);
                else callback(null, "Game " + gameId + " was killed.")
            });
        } else {
            callback("Tried to kill game " + gameId + ". But, the game is in state" + GameStates[game.state]);
        }
    });
};

module.exports = {
    getGame,
    activateNewGame,
    addPlayerToGame,
    gameRegister,
    revealSecret,
    distribute,
    startGame,
    killGame
};
