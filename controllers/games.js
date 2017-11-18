var mongoose = require('mongoose');
var Game = require('./../models/Game');
var GameStates = require('./../util/GameStates');

var getGame = function(gameId, callback) {
    Game.findOne({id: gameId}).then(function(game) {
        if (!game) return callback('Game not found');
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
        if (!game) return callback('Game does not exist');
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
        if (!game) return callback('Game does not exist');
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
        if (!game) return callback('Game does not exist');
        else return callback(null, game);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var updateGameState = function(req, res) {
    var id = req.params.id;

    var body = _.pick(req.body, ['state']);

    // Set game to completed if Distribute is done
    if (req.body.state && req.body.state == 6) {
        body.state = 7;
        body.completed = true;
    }

    Game.findOneAndUpdate({id}, {$set: body}, {new: true}).then(function(game) {
        if (!game) {
            return res.status(404).send('Game does not exist');
        } else {
            return res.send({game});
        }
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};

var killGame = function(gameId, callback) {
    Game.find({ id: gameId }, function(err, game) {
        if (err) callback(err);

        if (game.state == GameStates.PLAYERS_JOIN) {
            game.state = GameStates.GAME_KILLED;
            game.save(function(err, updatedGame) {
                if (err) callback(err);
                else callback(null ,"Game " + gameId + " was killed.")
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
    updateGameState,
    killGame
};
