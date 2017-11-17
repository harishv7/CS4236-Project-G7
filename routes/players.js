var express = require('express');
var router = express.Router();

var playerController = require('./../controllers/players');


router.get('/:id', playerController.displayPlayer);
router.get('/', playerController.displayPlayers);

router.post('/', playerController.createPlayer);

router.patch('/:id', playerController.updatePlayer);

router.delete('/:id', playerController.deletePlayer);


module.exports = router;
