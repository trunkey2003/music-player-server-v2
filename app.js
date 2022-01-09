const dotenv = require('dotenv');
dotenv.config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index.routes');
const apiRouter = require('./routes/api.routes');

var app = express();
app.use(cors({ credentials: true, origin: [process.env.CLIENT_HOSTNAME_1, process.env.CLIENT_HOSTNAME_2, process.env.CLIENT_HOSTNAME_3, process.env.CLIENT_HOSTNAME_4] }));
app.use(cookieParser());


const db = require('./configs/db/index');

console.clear();

db.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log("Database Connected !!!");
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

module.exports = app;
