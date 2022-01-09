const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSong = require('./userSongs.model');

const user = new Schema({
    fullName : {type:String, default:"full name"},
    dateOfBirth: {type:String, default:"01/01/2022"},
    Phone:{type:String, default:"0123456789"},
    Email:{type:String, unique: true, require:true},
    userid:{type:String, unique: true, required:true},
    username:{type:String, unique: true, required: true},
    avatar:{type: String, default:"https://trunkey2003.github.io/general-img/default-profile-pic.jpg"},
    password:{type:String},
    songCount:{type: Number, default: 0},
});

module.exports = mongoose.model('user', user);