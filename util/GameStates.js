/*
 * NOTE: If a game is at state X, it means that game has gone through state X, NOT
 * the game is now in state X.
 */

var gameStates = {
    ACTIVATE: 0,
    PLAYERS_JOIN: 1,
    GAME_KILLED: 2,
    GAME_START: 3,
    GAME_REGISTER: 4,
    REVEAL_SECRET: 5,
    DISTRIBUTE: 6,
    COMPLETED: 7
};

module.exports = gameStates;