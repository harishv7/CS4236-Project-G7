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
        min_bid_value: req.body.min_bid_value,
        start_time: Date.now()
    });

    game.save().then(function(game) {
        return res.send(game);
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};

var add_player = function(req, res) {
    var body = _.pick(req.body, ['game_id', 'player_id']);

    Game.findOneAndUpdate({id: body.game_id}, {$push: {players: body.player_id}}, {new: true}).then(function(game) {
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

var game_register = function(req, res) {
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

var update_game_state = function(req, res) {
    var id = req.params.id;

    var body = _.pick(req.body, ['state']);

    // Set game to completed if Distribute is done
    if (req.body.state && req.body.state == 5) {
        body.state = 6;
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
    add_player,
    game_register,
    update_game_state,
    delete_game
}
