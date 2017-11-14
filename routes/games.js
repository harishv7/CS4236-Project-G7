var express = require('express');
var router = express.Router();

var game_controller = require('./../controllers/games');


router.get('/:id', game_controller.display_game);
router.get('/', game_controller.display_games);

router.post('/activate', game_controller.activate);
router.post('/add-player', game_controller.add_player);
router.post('/game-register', game_controller.game_register);

router.patch('/:id/', game_controller.update_game_state);

router.delete('/:id', game_controller.delete_game);


module.exports = router;
