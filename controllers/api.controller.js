const db = require('../configs/db/index');


class ApiController{
    show(req,res){
        res.json("Hello, this is Trunkey's music player api");
    }

    getUsSong(req,res){
        const sql = "SELECT * FROM songus";
        db.query(sql, (err,result) => {
            if (err) throw err;
            res.status(200).send(result);
        })
    }

    getVnSong(req,res){
        const sql = "SELECT * FROM songvn";
        db.query(sql, (err,result) => {
            if (err) throw err;
            res.status(200).send(result);
        })
    }
}

module.exports = new ApiController;