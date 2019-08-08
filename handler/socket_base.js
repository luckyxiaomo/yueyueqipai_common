const path = require("path");
const log4js = require('../logs/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

//////////////////////////////////////////////////////
/**
 * 通用socket handlers
 */
const dhrc4 = require('../utils/dhrc4')
const crypto = require('crypto')
const b64_reg = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/
const white_cmd_list = ['challenge', 'auth'];

/**
 * 注册消息.
 */
exports.register_handler = function (socket) {
    logger.debug("socket connection");
    var keys = dhrc4.gen_key();
    socket.challenge = {};
    socket.challenge.private_key = keys.private_key;
    socket.emit('key', { public_key: keys.public_key });

    //握手认证
    socket.on('challenge', data => {
        if (!b64_reg.test(data.key)) {
            logger.error('challenge:B64 failed.')
            socket.disconnect(true);
            return;
        }
        socket.challenge.secret = dhrc4.secret(socket.challenge.private_key, data.key)
        var rd_str = crypto.randomBytes(16).toString('base64');
        socket.challenge.rd_str = rd_str;
        var cy_str = dhrc4.encrypto(rd_str, socket.challenge.secret)
        socket.emit('challenge', { cy_str: cy_str });
    });

    //认证
    socket.on('auth', data => {
        var rd_text = data.rd_text;
        var token = data.token;

        if (!rd_text || !token) {
            socket.disconnect(true);
            return;
        }

        //验证rd_text
        if (rd_text != socket.challenge.rd_str && process.ENV_CONFIG.ENV != "dev") {
            socket.disconnect(true);
            return;
        }

        // 先随机给个用户ID
        socket.user_id = (Math.random() * (100 + 1) + 10).toFixed(0);

        //标记socket已经认证
        socket.authed = true;
        socket.emit('auth_finish');
    });

    //心跳
    socket.on('game_ping', (data) => {
        socket.emit('game_pong')
    })

    //错误
    socket.on('error', (err) => {
        logger.error("scoket on error =======>", err)
    })

    // 消息中间件
    socket.use((data, next) => {
        if (data[0] != "game_ping") logger.debug(data);     //  过滤心跳，打印输出
        if (white_cmd_list.indexOf(data[0]) != -1 && socket.authed == false) return;    // 权限验证
        if (data.length > 1 && typeof data[1] != "object") {
            logger.warn("data[1] is not object :", data);
            socket.disconnect(true);
            return;
        }
        return next();
    });
}