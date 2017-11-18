var express = require('express');
var router = express.Router();

var gameController = require('./../controllers/games');


router.get('/:id', gameController.getGame);
router.get('/', gameController.displayGames);

router.post('/activate', gameController.activateNewGame);
router.post('/add-player', gameController.addPlayer);

router.patch('/:id/game-register', gameController.gameRegister);
router.patch('/:id', gameController.updateGameState);

router.delete('/:id', gameController.deleteGame);


module.exports = router;
