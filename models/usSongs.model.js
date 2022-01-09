const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usSong = new Schema({
    name: {type:String},
    singer: {type:String},
    path: {type:String},
    image: {type:String},
});

module.exports = mongoose.model('usSong', usSong);