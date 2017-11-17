var express = require('express');
var router = express.Router();

var player_controller = require('./../controllers/players');


router.get('/:id', player_controller.display_player);
router.get('/', player_controller.display_players);

router.post('/', player_controller.create_player);

router.patch('/:id', player_controller.update_player);

router.delete('/:id', player_controller.delete_player);


module.exports = router;
