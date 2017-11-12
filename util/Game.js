var GameStates = require('./GameStates');

class Game {
    constructor(gameId, minBidValue) {
        console.log("Initialised new game: " + gameId + ", minBid: " + minBidValue);
        this._gameId = gameId;
        this._minBidValue = minBidValue;
        this._numOfPlayers = 0;
        this._players = []; // array containing player ids
        this._gameState = GameStates.ACTIVATE;
    }

    addNewPlayer(playerId, playerBalance, callback) {
        if (playerBalance > this._minBidValue) {
            this._numOfPlayers += 1;
            this._players.push(playerId);
            callback(null);
        } else {
            callback("Player has insufficient funds to join game.");
        }
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