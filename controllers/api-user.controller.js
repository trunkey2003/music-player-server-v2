const db = require('../configs/db/index');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 13;
var jwt = require('jsonwebtoken');

class ApiUserController {
    async getAllUser(req, res, next) {
        const sql = `SELECT * FROM users`;
        if (res.locals.userid == '9b4836dc-1e08-4a54-9c90-c121ecf8f7bc') //because there is only one admin in my server
            db.query(sql, async (err, result) => { if (err) return; res.send(result) })
        else res.status(403).send("You don't have right to access this data !!");
    }

    getUser(req, res) {
        const sql = `
        SELECT u.user_id AS userid, u.full_name AS fullName, u.date_of_birth AS dateOfBirth, u.user_name AS username, u.avatar, u.password, COUNT(us.user_id) as songCount 
        FROM users as u LEFT JOIN user_songs as us ON us.user_id = u.user_id
        WHERE u.user_name = '${req.params.username}'
        GROUP BY u.user_id
        `;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(404).send(err);
            }
            const [newobj] = result;
            if (!result.length){
                res.send(result);
                return;
                res.status(404).send(`User ${req.params.username} doesn't exist`);
                return;
            }
            if (req.params.username != res.locals.username) {
                newobj.userid = undefined;
                newobj.password = undefined;
                newobj.phone = undefined;
                newobj.email = undefined;
            } else {
                newobj.password = undefined;
            }
            if (res.locals.username) newobj.onAccess = res.locals.username;
            res.status(200).send(newobj);
        });
    }

    modifyUserFullName(req, res) {
        const sql = `UPDATE users SET full_name = '${req.body.fullName}' WHERE user_name = '${res.locals.username}'`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(403).send("cannot set full name");
                return;
            }
            res.status(200).send(result);
        });
    }

    modifyUserUserName(req, res) {
        const sql = `UPDATE users SET user_name = '${req.body.username}' WHERE user_name = '${res.locals.username}'`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(403).send("cannot set user name");
                return;
            }
            res.status(200).send(result);
        });
    }

    async postUser(req, res) {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        var sql = `INSERT INTO users (user_id, user_name, email, password) VALUES ('${req.body.userid}', '${req.body.username}', ${req.body.email} ,'${hashedPassword}')`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("User already exist !!");
            }
            res.status(200).send({username : req.body.username});
        });
    }

    checkUserName(req, res, next) {
        var sql = `SELECT user_name FROM users WHERE user_name = '${req.body.username}' `;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(404).send(err);
            }
            res.send(!(result.length)); //EXIST AT LEAST 1 USERNAME EQUAL TO REQ.BODY.USERNAME
        });
    }

    checkUser(req, res, next) {
        if (!res.locals.userid) {
            next();
            return;
        }

        const sql = `SELECT user_name, user_id FROM users WHERE user_id = '${res.locals.userid}'`;
        db.query(sql, (err, result) => {
            if (err) {
                return;
            }
           
            const [user] = result;
            if (!user) {
                res.status(200).send("You are not my user");
                return;
            }
            res.locals.username = user.user_name;
            next();
        })
    }

    validateLogin(req, res, next) {
        const sql = `SELECT password, user_id as userid, user_name as username FROM users WHERE user_name = '${req.body.username}'`;
        db.query(sql, (err, result) => {
            if (err) return;
            if (result.length == 0) {
                res.status(403).send("Wrong username or password !!");
                return;
            }
            bcrypt.compare(req.body.password, result[0].password)
                .then((data) => {
                    if (data == true) {
                        res.locals.userid = result[0].userid;
                        res.locals.username = result[0].username;
                        next();
                        return;
                    }
                    res.status(403).send("Wrong username or password !!");
                })
        })
    }

    setToken(req, res, next) {
        const user = { userid: res.locals.userid };
        jwt.sign(user, process.env.TOKEN_SECRET_KEY, (err, token) => {
            if (err) {
                res.status(403).send("Cannot Set Token");
                return;
            }
            res.locals.token = token;
            next();
        });
    }

    validateActionUser(req, res, next){
        if (res.locals.username != req.params.username){
            res.status(403).send("You don't have right to do this action!!");
            return;
        }
        next();
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
                res.locals.userid = undefined;
                next();
                return;
            }
            res.locals.userid = user.userid;
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
        const sql = 
        `SELECT us.name, us.singer, us.path, us.image, us.song_id AS songid, us.user_id AS userid, us.playlist_id AS playlistid 
        FROM user_songs as us 
        INNER JOIN users ON users.user_name = '${req.params.username}' AND users.user_id = us.user_id AND us.playlist_id = users.user_id`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(404).send(err);
                return;
            }
            res.status(200).send(result);
        })
    }

    getUserSongsByPlaylist(req, res){
        const sql = 
        `SELECT us.name, us.singer, us.path, us.image, us.song_id AS songid, us.user_id AS userid, us.playlist_id AS playlistid 
        FROM user_songs as us 
        INNER JOIN users ON users.user_name = '${req.params.username}' AND users.user_id = us.user_id AND us.playlist_id = '${req.params.playlistid}'`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(404).send(err);
                return;
            }
            res.status(200).send(result);
        })
    }

    getAllUserSongs(req, res){
        const sql = `SELECT us.name, us.singer, us.path, us.image, us.song_id AS songid, us.user_id AS userid, us.playlist_id AS playlistid FROM user_songs as us INNER JOIN users ON users.user_name = '${req.params.username}' AND users.user_id = us.user_id`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(404).send(err);
                return;
            }
            res.status(200).send(result);
        })
    }

    getUserPlaylist(req, res){
        const sql = `
        SELECT up.playlist_id as playlistid, up.playlist_name as playlistName , count(us.song_id) AS songCount 
        FROM user_playlists as up LEFT JOIN user_songs AS us ON us.playlist_id = up.playlist_id 
        INNER JOIN users ON users.user_name = '${req.params.username}' AND users.user_id = up.user_id 
        GROUP BY up.playlist_id 
        ORDER BY up.updated_at;`
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("Cannot get user playlist");
                return;
            }
            const newObj = result;
            newObj.filter((index) => delete index["user_id"]);
            res.status(200).send(newObj);
        })
    }

    postUserPlaylist(req, res){
        var sql = `INSERT INTO user_playlists(playlist_id, playlist_name, user_id) VALUES ('${req.body.playlistid}', '${req.body.playlistName}', '${res.locals.userid}')`
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err);
                res.status(403).send("Cannot add your playlist");
                return;
            }
            res.status(200).send(result);
        })
    }

    postFirstUserPlaylist(req, res){
        var sql = `INSERT INTO user_playlists(playlist_id, playlist_name, user_id) VALUES ('${req.params.userid}', 'Default Playlist', '${res.params.userid}')`;
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err);
                res.status(409).send("Cannot add first playlist");
                return;
            }
            res.status(200).send(result);
        })
    }

    deleteUserPlaylist(req, res){
        var sql = `DELETE FROM user_playlists WHERE playlist_id = '${req.params.playlistid}' AND user_id = '${res.locals.userid}'`
        db.query(sql, (err, result) => {
            if (err) {
                res.status(404).send("Cannot delete");
                return;
            }
            
            if (result.affectedRows == 0) {
                res.status(304).send(result);
                return;
            }
            res.status(200).send(result);
            
        })
    }

    async postUserSongs(req, res) {
        var sql = `INSERT INTO user_songs VALUES ('${req.body.name}', '${req.body.singer}', '${req.body.path}', '${req.body.image}', '${req.body.songid}', '${req.body.userid}', '${req.body.playlistid}')`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("Cannot push song to database");
                return;
            }
            res.status(200).send(result);
        });
    }

    async deleteUserSongs(req, res, next) {
        var sql = `DELETE FROM user_songs WHERE song_id ='${req.params.id}'`;
        db.query(sql, (err, result) => {
            if (err) {
                res.status(409).send("Cannot push song to database");
                return;
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