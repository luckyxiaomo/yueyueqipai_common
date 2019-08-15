const path = require("path");
const log4js = require('../logs/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

//////////////////////////////////////////////////////
exports.start = function (app) {
    //设置跨域访问
    app.all('*', function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", ' 3.2.1')
        res.header("Content-Type", "application/json;charset=utf-8");
        logger.debug("[%s] %s => %s", req.method, req.path, JSON.stringify(req.query))
        next();
    });

}

// 大厅 获取本服务信息
exports.get_server_info = function (req, res) {
    show_request('/get_server_info  ====>', JSON.stringify(req.query))
    var serverid = req.query.serverid;
    if (serverid != process.ENV_CONFIG.SERVER_ID) {
        http.send(res, error.SYSTEM_ARGS_ERROR, "invalid parameters", null);
        return;
    }

    var locations = roomMgr.getUserLocations();
    var arr = [];
    for (var userId in locations) {
        var roomId = locations[userId].roomId;
        arr.push(userId);
        arr.push(roomId);
    }
    http.send(res, error.SUCCESS, "ok", { userroominfo: arr });
}