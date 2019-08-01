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
    socket.on('challenge', (data) => {
        show_request('challenge', data)
        if (typeof data != 'string') {
            logger.error("challenge:NOT String")
            socket.disconnect(true);
            return;
        }
        if (!b64_reg.test(data)) {
            logger.error('challenge:B64 failed.')
            socket.disconnect(true);
            return;
        }
        socket.challenge.secret = dhrc4.secret(socket.challenge.private_key, data)
        var rd_str = crypto.randomBytes(16).toString('base64');
        socket.challenge.rd_str = rd_str;
        var cy_str = dhrc4.encrypto(rd_str, socket.challenge.secret)
        socket.emit('challenge', { cy_str: cy_str });
    });

    //心跳
    socket.on('game_ping', (data) => {
        socket.emit('game_pong')
    })

    //错误
    socket.on('error', (err) => {
        logger.error("scoket on error ==>", err)
    })
}



/**
 * 显示请求方法.
 */
function show_request(commond, args) {
    logger.debug('Socket[%s][%s]', commond, args);
}
