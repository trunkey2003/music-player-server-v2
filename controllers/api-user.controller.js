const db = require('../configs/db/index');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 13;
var jwt = require('jsonwebtoken');
const { response } = require('express');

class ApiUserController {
    async getAllUser(req, res, next) {
        const sql = `SELECT * FROM users`;
        if (res.locals.username == 'trunkey') //because there is only one admin in my server
            db.query(sql, async (err, result) => { if (err) return; res.send(result) })
        else res.status(403).send("You don't have right to access this data !!");
    }

    getUser(req, res) {
        const sql = `
        SELECT u.user_id AS userid, u.full_name AS fullName, u.date_of_birth AS dateOfBirth, u.user_name AS username, u.avatar, u.password, COUNT(us.user_id) as Count 
        FROM users as u INNER JOIN user_songs as us ON us.user_id = u.user_id
        WHERE u.user_name = '${req.params.username}'
        GROUP BY u.user_id
        `;
        db.query(sql, (err, result) => {
            if (err) {
                throw err;
            }
            const [newobj] = result;
            if (req.params.username != res.locals.username) {
                newobj.userid = undefined;
                newobj.password = undefined;
                newobj.phone = undefined;
                newobj.email = undefined;
            } else {
                newobj.password = undefined;
            }
            res.status(200).send(newobj);
        });
    }

    modifyUserFullName(req, res) {
        const sql = `UPDATE users SET full_name = '${req.body.fullName}' WHERE user_name = '${res.locals.username}'`;
        db.query(sql, (err, result) => {
            if (err) {
                throw err;
            }
            res.status(200).send(result);
        });
    }

    async postUser(req, res) {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        var sql = `INSERT INTO users (user_id, user_name, password) VALUES ('${uuidv4()}', '${req.body.username}', '${hashedPassword}')`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("User already exist !!");
            }
            res.status(200).send(result);
        });
    }

    checkUserName(req, res, next) {
        var sql = `SELECT user_name FROM users WHERE user_name = '${req.body.username}' `;
        db.query(sql, (err, result) => {
            if (err) {
                throw err;
            }
            res.send(!(result.length)); //EXIST AT LEAST 1 USERNAME EQUAL TO REQ.BODY.USERNAME
        });
    }

    checkUser(req, res, next) {
        if (!res.locals.username) {
            next();
            return;
        }

        const sql = `SELECT user_name, user_id FROM users WHERE user_name = '${res.locals.username}'`;
        db.query(sql, (err, result) => {
            const [user] = result;
            if (!user) res.status(200).send("You are not my user");
            res.locals.userid = user.user_id;
            next();
        })
    }

    validateLogin(req, res, next) {
        const sql = `SELECT password FROM users WHERE user_name = '${req.body.username}'`;
        db.query(sql, (err, result) => {
            if (err) return;
            if (result.length == 0) res.status(403).send("Wrong username or password !!");
            bcrypt.compare(req.body.password, result[0].password)
                .then((data) => {
                    if (data == true) {
                        res.locals.username = req.body.username;
                        next();
                        return;
                    }
                    res.status(403).send("Wrong username or password !!");
                })
        })
    }

    setToken(req, res, next) {
        const user = { username: res.locals.username };
        jwt.sign(user, process.env.TOKEN_SECRET_KEY, (err, token) => {
            if (err) res.status(403).send("Cannot Set Token");
            res.locals.token = token;
            next();
        });
    }

    validateTokenCookie(req, res, next) {
        if (!req.cookies.token) {
            res.locals.username = undefined;
            res.locals.userid = undefined;
            next();
            return;
        }

        jwt.verify(req.cookies.token, process.env.TOKEN_SECRET_KEY, (err, user) => {
            if (err) {
                res.locals.username = undefined;
                next();
                return;
            }
            res.locals.username = user.username;
            next();
        })
    }

    setTokenCookie(req, res, next) {
        console.log(res.locals.token);
        res.cookie('token', res.locals.token, {
            sameSite: (process.env.DEV_ENV) ? 'lax' : 'none',
            secure: (process.env.DEV_ENV) ? false : true,
            httpOnly: true,
            maxAge: 3600000 * 24 * 7,
        }).status(200).send({ username: res.locals.username })
    }

    getUserSongs(req, res) {
        const sql = `SELECT us.name, us.singer, us.path, us.image, us.song_id AS songid, us.user_id AS userid FROM user_songs as us INNER JOIN users ON users.user_name = '${req.params.username}' AND users.user_id = us.user_id`;
        db.query(sql, (err, result) => {
            if (err) {
                throw err;
            }
            res.status(200).send(result);
        })
    }

    async postUserSongs(req, res) {
        var sql = `INSERT INTO user_songs VALUES ('${req.body.name}', '${req.body.singer}', '${req.body.path}', '${req.body.image}', '${req.body.songid}', '${req.body.userid}')`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("Cannot push song to database");
            }
            res.status(200).send(result);
        });
    }

    async deleteUserSongs(req, res, next) {
        var sql = `DELETE FROM user_songs WHERE song_id ='${req.params.id}'`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("Cannot push song to database");
            }
            res.status(200).send(result);
        });

        // const songCount = await userSong.count({ userid: res.locals.id });
        // userSong.deleteOne({ _id: req.params.id, userid: res.locals.id })
        //     .then(() => { user.findOneAndUpdate({ userid: res.locals.id }, { songCount: songCount }, { returnOriginal: false }).then(() => res.status(200).send("Song Deleted !!")) })
        //     .catch(() => res.send(`cannot delete song id : ${req.params.id}`));
    }

    async deleteUserSongsBySongID(req, res, next) {
        const songCount = await userSong.count({ userid: res.locals.id });
        userSong.deleteOne({ songid: req.params.id, userid: res.locals.id })
            .then(() => { user.findOneAndUpdate({ userid: res.locals.id }, { songCount: songCount }, { returnOriginal: false }).then(() => res.status(200).send("Song Deleted !!")) })
            .catch(() => res.send(`cannot delete song id : ${req.params.id}`));
    }

    // getCookie(req, res, next){
    //     res.cookie("username", "trunkey", {sameSite: 'strict', path: '/', expires: new Date(new Date().getTime() + 60*1000), httpOnly: true}).status(200).send("cookie installed");
    // }

    // postCookie(req, res, next){
    //     res.cookie("username", req.body.username, {sameSite: 'strict', path: '/', expires: new Date(new Date().getTime() + 5*1000), httpOnly: true}).status(200).send("cookie installed");
    // }

    clearCookie(req, res, next) {
        res.cookie('token', "none", {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
            maxAge: 0,
        }).status(200).send("Cookie cleared");
    }

}

module.exports = new ApiUserController;