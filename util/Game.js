var GameStates = require('./GameStates');

class Game {
    constructor(gameId, minBidValue) {
        console.log("Initialised new game: " + gameId + ", minBid: " + minBidValue);
        this._gameId = gameId;
        this._minBidValue = minBidValue;
        this._numOfPlayers = 0;
        this._players = []; // array containing player ids
        this._gameState = GameStates.ACTIVATE;
        this._gameRegister = {};
        this._revealSecret = {};
    }

    gameRegister(playerId, commitGuess, commitSecret, bidValue, callback) {
        // TODO: Subtracts $bid_value from user Pi. Adds $bid_value to Broker

        // Store Commit(s,r1), Commit(guess,r2), bid_value in some arrays
        if (this._players.indexOf(playerId) != -1) {
            this._gameRegister[playerId] = {
                "commitGuess": commitGuess,
                "commitSecret": commitSecret,
                "bidValue": bidValue
            };
            callback(null);
        } else {
            callback("Player does not exist.")
        }
    }

    revealSecret(playerId, secret, guess, rOne, rTwo, callback) {
        // Store (s, r1, guess, r2) in some arrays.
        if (this._players.indexOf(playerId) != -1) {
            this._revealSecret[playerId] = {
                "secret": secret,
                "guess": guess,
                "rOne": rOne,
                "rTwo": rTwo,
            };
            callback(null);
        } else {
            callback("Player does not exist.");
        }
    }

    addNewPlayer(playerId, callback) {
        // TODO: Get player balance from db
        const playerBalance = 10000;
        if (playerBalance > this._minBidValue) {
            this._numOfPlayers += 1;
            this._players.push(playerId);
            callback(null);
        } else {
            callback("Player has insufficient funds to join game.");
        }
    }

    distribute(callback) {
        // TODO: Check the submitted commitments. If all commitments can be opened correctly

        // TODO: Otherwise (someone doesn’t open the commitment)

        // TODO: callback with who is winner, winning amount etc.
    }

    get gameState() {
        return this._gameState;
    }

    get numOfPlayers() {
        return this._numOfPlayers;
    }

    set numOfPlayers(playersCount) {
        this._numOfPlayers = playersCount;
    }

    incrementGameState() {
        this._gameState += 1;
    }
}

module.exports = Game;