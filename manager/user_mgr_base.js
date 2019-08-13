const path = require("path");
const log4js = require('../logs/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////
/**
 * 玩家管理模块
 */
const database_mgr_base = require('./database_mgr_base');
/**
 * 数据存储区域
 */
const user_map_account = {} // K:user_id V:account
const user_map_socket = {} // K:user_id V:socket
const user_map_table = {}; //K:user_id V:table_id


/**
 * 释放掉玩家所有数据
 */
exports.free_user = function (user_id) {
    exports.free_socket(user_id);
    exports.free_table(user_id);
    delete user_map_account[user_id];
}

/**
 * 绑定玩家和socket关系
 */
exports.bind_socket = function (user_id, socket) {
    const old_socket = user_map_socket[user_id]
    if (old_socket) {
        if (old_socket.id != socket.id) {
            user_map_socket[user_id].disconnect(true);
            delete user_map_socket[user_id];
            user_map_socket[user_id] = socket;
        }
    } else {
        user_map_socket[user_id] = socket
    }
}

/**
 * 获取指定玩家socket
 */
// exports.get_user_socket = function (user_id) {
//     return user_map_socket[user_id];
// }

exports.free_socket = function (user_id) {
    delete user_map_socket[user_id];
}

exports.bind_table = function (user_id, table_id) {
    user_map_socket[user_id].table_id = table_id;
    user_map_socket[user_id].join(table_id);
    user_map_table[user_id] = table_id;
}

exports.free_table = function (user_id) {
    if (user_map_socket[user_id]) {
        user_map_socket[user_id].table_id = null;
        user_map_socket[user_id].leave(table_id);
    }
    delete user_map_table[user_id];
}

exports.send_user_Msg = function (user_id, event, msgdata) {
    const socket = user_map_socket[user_id];
    if (socket == null) {
        return;
    }

    socket.emit(event, msgdata);
};

exports.get_user_info_async = async function (user_id) {
    return await database_mgr_base.get_user_info_async(user_map_account[user_id]);
}

exports.load_user_info_async = async function (account = "") {
    const user_info = await database_mgr_base.get_user_info_async(account);
    if (user_info) {
        user_map_account[user_info.userid] = account
        return user_info.user_id;
    }
    return null;
}

