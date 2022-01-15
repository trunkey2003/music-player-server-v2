const express = require('express');
const router = express.Router();

const apiController = require('../controllers/api.controller');
const ApiUserController = require('../controllers/api-user.controller');

/* GET users listing. */
router.get('/user/:username/:playlistid/songs', ApiUserController.validateTokenCookie , ApiUserController.checkUser,ApiUserController.getUserSongsByPlaylist);
router.get('/user/:username/songs', ApiUserController.validateTokenCookie , ApiUserController.checkUser,ApiUserController.getUserSongs);
router.get('/user/:username/allsongs', ApiUserController.validateTokenCookie ,ApiUserController.checkUser,ApiUserController.getAllUserSongs);
router.post('/user/:username/songs', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.validateActionUser, ApiUserController.postUserSongs);
router.delete('/user/:username/songs/:id', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.validateActionUser, ApiUserController.deleteUserSongs);
router.delete('/user/:username/songid/:id/', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.validateActionUser, ApiUserController.deleteUserSongsBySongID);

router.get('/user/:username/playlists', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.getUserPlaylist);
router.post('/user/:username/playlists', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.postUserPlaylist);
router.delete('/user/:username/playlists/:playlistid', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.validateActionUser, ApiUserController.deleteUserPlaylist);

router.get('/user/signout', ApiUserController.clearCookie);
router.post('/user/login', ApiUserController.validateLogin, ApiUserController.setToken, ApiUserController.setTokenCookie);

//GET USER
router.get('/user/:username', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.getUser);
router.get('/user', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.getAllUser);

router.post('/user/signup/checkusername', ApiUserController.checkUserName);
router.post('/user/signup', ApiUserController.postUser);

router.put('/user/edit/:username/fullname', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.validateActionUser, ApiUserController.modifyUserFullName);
router.put('/user/edit/:username/username', ApiUserController.validateTokenCookie, ApiUserController.checkUser, ApiUserController.validateActionUser, ApiUserController.modifyUserUserName);

router.get('/admin/vn', apiController.getVnSong);
router.get('/admin/us', apiController.getUsSong);
// router.get('/cookie', ApiUserController.getCookie);
// router.post('/cookie', ApiUserController.postCookie);
router.get('/',apiController.show);


module.exports = router;