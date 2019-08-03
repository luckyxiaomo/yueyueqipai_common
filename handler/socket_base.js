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
// const white_cmd_list = ['challenge','auth'];

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
    socket.on('challenge', (data = {}) => {
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

    //认证
    socket.on('auth', (data = {}) => {
        show_request('auth', data)
        if (typeof data == "string") {
            data = JSON.parse(data);
        }

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

        // database_service.load_match_user_by_token(token, function (result) {
        //     if (!result) {
        //         logger.error("load match user failed!!!");
        //         socket.emit('auth_result', error.MATCH_NO_JOIN);
        //         return;
        //     }
        //     var user_info = {
        //         user_id: result.user_id,
        //         name: result.name,
        //         headimg: result.headimg,
        //         score: result.score,
        //         sex: result.sex,
        //         online: true,
        //         token: token
        //     };

        //     var user_status = result.status;

        //     //检测玩家是否在游戏中，而且游戏开始，如果不在游戏中就返回比赛已经开始，不在允许玩家进入
        //     if (gameManager.is_begin()) {


        //         var userobj = gameManager.userManager.find_user(user_info.user_id)

        //         if (!userobj) {
        //             if (user_status == 2) {
        //                 //玩家参加过比赛,需要恢复状态
        //                 socket.emit('match_begin', { current_loops: gameManager.get_current_loops(), max_loops: gameManager.get_max_loops() })
        //                 gameManager.userManager.rebind_user(user_info.user_id, socket)
        //                 socket.user = user_info;
        //                 return;
        //             } else {
        //                 logger.warn("Game Has began, New User Cannot Join:", user_info.user_id)
        //                 socket.emit('auth_result', error.MATCH_HAS_BEGIN);
        //                 socket.disconnect(true)
        //                 return
        //             }
        //         } else {
        //             logger.info("User reconnected...............................")
        //             //重新绑定玩家
        //             socket.emit('match_begin', { current_loops: gameManager.get_current_loops(), max_loops: gameManager.get_max_loops() })
        //             gameManager.userManager.rebind_user(user_info.user_id, socket)
        //             socket.user = user_info;
        //         }
        //     } else {
        //         socket.user = user_info
        //         gameManager.userManager.bind(user_info.user_id, socket);
        //     }

        //标记socket已经认证
        socket.authed = true;
        // socket.emit('auth_result', error.SUCCESS);
        socket.emit('auth_finish');
        // });
    });

    //心跳
    socket.on('game_ping', (data) => {
        socket.emit('game_pong')
    })

    //错误
    socket.on('error', (err) => {
        logger.error("scoket on error ==>", err)
    })

    // 消息中间件
    socket.use((data, next) => {
        console.log(data);
        return next();
        // if (data[0] in white_cmd_list) return next();
        // next(new Error('Not Auth！！！'));
        // socket.disconnect(true);
    });
}



/**
 * 显示请求方法.
 */
function show_request(commond, data) {
    logger.debug('Socket[%s][%s]', commond, data);
}
