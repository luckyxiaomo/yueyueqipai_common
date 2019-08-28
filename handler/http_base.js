const path = require("path");
const log4js = require('../utils/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

//////////////////////////////////////////////////////
const http_client = require('../utils/http_client');
const express = require('express');
const app = express();
const CONFIG = process.ENV_CONFIG;

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

