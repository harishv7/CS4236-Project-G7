var express = require('express');
var router = express.Router();

var user_controller = require('./../controllers/users');


router.get('/:id', user_controller.display_user);
router.get('/', user_controller.display_users);

router.post('/', user_controller.create_user);

router.patch('/:id', user_controller.update_user);

router.delete('/:id', user_controller.delete_user);


module.exports = router;
