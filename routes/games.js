var express = require('express');
var router = express.Router();

var gameController = require('./../controllers/games');


router.get('/:id', gameController.displayGame);
router.get('/', gameController.displayGames);

router.post('/activate', gameController.activateGame);
router.post('/add-player', gameController.addPlayer);

router.patch('/game-register', gameController.gameRegister);
router.patch('/:id', gameController.updateGameStatus);

router.delete('/:id', gameController.deleteGame);


module.exports = router;
