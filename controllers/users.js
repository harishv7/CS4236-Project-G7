var _ = require('lodash');
var mongoose = require('mongoose');
var User = require('./../models/User');

var display_user = function(req, res) {
    var id = req.params.id;

    User.findOne({id}).then(function(user) {
        if (!user) {
            return res.status(404).send('User not found');
        }
        return res.send({user});
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var display_users = function(req, res) {
    User.find().then(function(users) {
        if (users.length == 0) {
            return res.status(404).send('No users found');
        }
        return res.send({users});
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var create_user = function(req, res) {
    let user = new User({
        id: req.body.id,
        name: req.body.name
    });

    user.save().then(function(user) {
        return res.send(user);
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var update_user = function(req, res) {
    var id = req.params.id;
    var balance = req.body.balance;

    var body = _.pick(req.body, ['balance']);
    body.balance = balance;

    User.findOneAndUpdate({id}, {$set: body}, {new: true}).then(function(user) {
        if (!user) {
            return res.status(404).send('User not found');
        } else {
            return res.send({user});
        }
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


var delete_user = function(req, res) {
    var id = req.params.id;

    User.findOneAndRemove({id}).then(function(user) {
        if (!user) {
            return res.status(404).send('User not found');
        }
        return res.send('User has been deleted');
    })
    .catch(function(err) {
        return res.status(400).send(err);
    });
};


module.exports = {
    display_user,
    display_users,
    create_user,
    update_user,
    delete_user
}
