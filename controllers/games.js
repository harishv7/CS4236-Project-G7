var _ = require('lodash');
var mongoose = require('mongoose');
var Game = require('./../models/Game');

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

var gameRegister = function(gameId, playerId, commitSecret, commitGuess, bidValue, callback) {
    var temp = {
        player_id: playerId,
        commit_secret: commitSecret,
        commit_guess: commitGuess,
        bid_value: bidValue
    };

    //TODO: Handle condition where bid_value is less than the game's min_bid_value

    Game.findOneAndUpdate({id: gameId}, {$push: {game_registers: temp}}, {new: true}).then(function(game) {
        if (!game) {
            return callback('Game does not exist');
        } else {
            return callback(null, game);
        }
    })
    .catch(function(err) {
        return callback(err);
    });
}

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

var deleteGame = function(req, res) {
    var id = req.params.id;

    Game.findOneAndRemove({id}).then(function(game) {
        if (!game) {
            return res.status(404).send('Game not found');
        }
        return res.send('Game has been deleted');
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
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
