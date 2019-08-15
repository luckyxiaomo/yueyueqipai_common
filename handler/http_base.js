const path = require("path");
const log4js = require('../logs/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

//////////////////////////////////////////////////////
const http_client = require('../utils/http_client');
const express = require('express');
const user_mgr_base = require('../manager/user_mgr_base');
const app = express();
const CONFIG = process.ENV_CONFIG;
let LastTickTime = 0;

exports.start = function (http_port) {
    app.listen(http_port, CONFIG.LOCAL_IP, () => {
        app._router.stack.map(item => {
            if (item.route) logger.info('path: %s', item.route.path);
        })
    });

    logger.info("Http Service Running At::" + CONFIG.LOCAL_IP + ":" + http_port);
    return app;
}

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

//向大厅服定时心跳
exports.update = function (gameServerInfo) {
    const now = Date.now();
    if (now > LastTickTime + CONFIG.HTTP_TICK_TIME) {
        LastTickTime = now;
        gameServerInfo.load = user_mgr_base.get_user_amount();
        const mem = process.memoryUsage();
        gameServerInfo.memory = JSON.stringify({
            heapTotal: mem_format(mem.heapTotal),
            heapUsed: mem_format(mem.heapUsed),
            rss: mem_format(mem.rss)
        })
        logger.debug("load:%s memory:%s", gameServerInfo.load, gameServerInfo.memory);
        http_client.get(CONFIG.HALL_IP, CONFIG.HALL_PORT, "/register_gs", gameServerInfo, (ret, data) => {
            if (ret && data.errcode != 0) {
                logger.error(data.errmsg);
            }
        });
    }
}

function mem_format(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
};