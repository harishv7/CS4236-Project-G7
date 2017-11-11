var express = require('express');
var router = express.Router();

var game_controller = require('./../controllers/games');


router.get('/:id', game_controller.display_game);
router.get('/', game_controller.display_games);

router.post('/activate', game_controller.activate);

router.patch('/:id/killgame', game_controller.kill_game);

router.delete('/:id', game_controller.delete_game);


module.exports = router;
