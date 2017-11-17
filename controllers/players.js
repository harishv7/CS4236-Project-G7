var _ = require('lodash');
var mongoose = require('mongoose');
var Player = require('./../models/Player');

var display_player = function(req, res) {
    var id = req.params.id;

    Player.findOne({id}).then(function(player) {
        if (!player) {
            return res.status(404).send('Player not found');
        }
        return res.send({player});
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var display_players = function(req, res) {
    Player.find().then(function(players) {
        if (players.length == 0) {
            return res.status(404).send('No players found');
        }
        return res.send({players});
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var create_player = function(req, res) {
    let player = new Player({
        id: req.body.id,
        name: req.body.name
    });

    player.save().then(function(player) {
        return res.send(player);
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var update_player = function(req, res) {
    var id = req.params.id;
    var balance = req.body.balance;

    var body = _.pick(req.body, ['balance']);
    body.balance = balance;

    Player.findOneAndUpdate({id}, {$set: body}, {new: true}).then(function(player) {
        if (!player) {
            return res.status(404).send('Player not found');
        } else {
            return res.send({player});
        }
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var delete_player = function(req, res) {
    var id = req.params.id;

    Player.findOneAndRemove({id}).then(function(player) {
        if (!player) {
            return res.status(404).send('Player not found');
        }
        return res.send('Player has been deleted');
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


module.exports = {
    display_player,
    display_players,
    create_player,
    update_player,
    delete_player
}
