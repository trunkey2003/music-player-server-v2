const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');  

const userSong = new Schema({
    userid: {type: String},
    username: {type: String},
    name: {type:String},
    singer: {type:String},
    path: {type:String},
    image: {type:String},
    songid: {type: String, default: uuidv4()},
});

module.exports = mongoose.model('userSong', userSong);