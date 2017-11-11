var express = require('express');
var router = express.Router();

var game_controller = require('./../controllers/games');


router.get('/:id', game_controller.display_game);
router.get('/', game_controller.display_games);

router.post('/', game_controller.create_game);

router.patch('/:id', game_controller.update_game);

router.delete('/:id', game_controller.delete_game);


module.exports = router;
