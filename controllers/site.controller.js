class SiteController{
    show(req,res,next){
        res.json("Xin chào");
    }
}

module.exports = new SiteController;