var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var assert = require('assert');

// Making mongoose use the default promise and not a third-party promise
mongoose.Promise = global.Promise;

var url = 'mongodb://localhost:27017/test';

mongoose.connect(url, {useMongoClient: true}, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
});
