var _ = require('lodash');
var mongoose = require('mongoose');
var Game = require('./../models/Game');

var display_game = function(req, res) {
    var id = req.params.id;

    Game.findOne({id}).then(function(game) {
        if (!game) {
            return res.status(404).send('Game not found');
        }
        return res.send({game});
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var display_games = function(req, res) {
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


var activate = function(req, res) {
    let game = new Game({
        min_bid: req.body.min_bid,
        start_time: Date.now()
    });

    game.save().then(function(game) {
        return res.send(game);
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var kill_game = function(req, res) {
    var id = req.params.id;

    var body = _.pick(req.body, ['completed']);

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


var delete_game = function(req, res) {
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
    display_game,
    display_games,
    activate,
    kill_game,
    delete_game
}
