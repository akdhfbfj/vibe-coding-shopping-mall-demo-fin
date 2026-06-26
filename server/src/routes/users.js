const express = require('express');
const userController = require('../controllers/userController');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/login', userController.loginUser);
router.get('/me', protect, userController.getMe);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
