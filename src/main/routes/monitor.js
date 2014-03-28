var EyeballRoutesMonitor = function(req,res) {

    eyeball.DB.stats(function(err,data) {
        if(err) {
            res.send(err);
        }
        res.send(JSON.stringify(data));
    });

};

module.exports = EyeballRoutesMonitor;