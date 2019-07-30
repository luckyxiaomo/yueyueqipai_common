var path = require("path");
var log4js = require('./logs/log').log4js;
var logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////
/**
 * 玩家管理模块
 */


/**
 * 存储空间
 */
var users = {}  // 玩家存储对象
var total_users = 0;    // 玩家总人数
var allio = null;   // sockets 对象



/**
 * 玩家管理
 * 1，负责玩家数据管理
 */
var database_service = require('../service/database')
var mail_service = require('../service/mail_service');
var string_service = require('../service/string_service');
var config_service = require('../service/config_service');
var match_config = {};
var awards = {};
//0 WAIT 1 BEGIN 2 END

/**
 * 绑定玩家和socket关系
 */
exports.bind = function (user_id, socket) {
    if (users[user_id]) {
        var old_socket = users[user_id]
        if (old_socket.id != socket.id) {
            users[user_id].disconnect(true);
            delete users[user_id];
            users[user_id] = socket;
        }
        total_users += 1;
        logger.debug("binded user, user counts not added......", total_users)
    } else {
        users[user_id] = socket
        total_users += 1;
        allio.sockets.emit('match_counts', total_users);
        logger.debug("binded user, user counts added......", total_users)
    }
}

/** 
 * 已经有socket绑定的玩家重新绑定socket关系
 */
exports.rebind_user = function (user_id, socket) {
    var old_socket = users[user_id]
    if (old_socket) {
        var table = old_socket.table;
        old_socket.disconnect(true)
        users[user_id] = socket;
        socket.table = table;
        socket.join('' + table.id)
        table.user_online_status(user_id, true)
        logger.debug("rebined not add user counts ........", total_users)
    } else {
        users[user_id] = socket;
        total_users += 1;
        logger.debug("rebined added user counts .........", total_users)
        allio.sockets.emit('match_counts', total_users);
    }
}

//释放玩家
exports.free = function (user_id) {
    // if(users[user_id]){
    //     users[user_id].disconnect(true);
    //     delete users[user_id]
    //     total_users -=1;
    // }
    if (users[user_id]) {
        var user = users[user_id].user;
        var table = users[user_id].table;
        if (user) {
            if (table) {
                user.oneline = false;
                table.user_online_status(user_id, false);
                console.error("free total users not plus ..........", total_users)
            } else {
                delete users[user_id];
                total_users -= 1;
                console.error("free total users plus .........", total_users)
                allio.sockets.emit("match_counts", total_users);
            }
        }
    }
}

exports.get_user_counts = function () {
    return total_users;
}


//获取所有在线的玩家ID
exports.get_user_ids = function () {
    return Object.keys(users);
}

//绑定玩家socket命名空间
exports.bind_namespace = function (user_id, namespace, table) {
    var socket = users[user_id]
    if (socket) {
        socket.table = table
        socket.join(namespace);
        var indx = table.get_user_index(user_id)
        var user_data = {
            seat_index: indx,
            user_id: user_id,
            name: socket.user.name,
            headimg: socket.user.headimg,
            sex: socket.user.sex,
            score: socket.user.score,
            online: true,
            table_id: namespace,
        }
        console.log("show me match_new_user ------------------->", user_data)
        allio.in(namespace).emit('match_new_user', user_data);
    }
}

//移除玩家的名称空间和table
exports.remove_namespace = function (user_id, namespace, bordcast, table) {
    var socket = users[user_id];
    if (socket) {
        socket.leave('' + namespace);
        if (bordcast) {
            allio.in('' + namespace).emit('leave', user_id);
        }
        if (table) {
            if (socket.table) {
                delete socket.table;
            }
        }
    }
}

//添加玩家到wait space
exports.move_to_wait = function (user_id) {
    var socket = users[user_id]
    if (socket) {
        socket.join('wait_space')
        socket.emit('waiting')
    }
}

//离开等待空间
exports.leave_wait = function (user_id) {
    var socket = users[user_id];
    if (socket) {
        socket.leave('wait_space');
        socket.emit('leave_waiting')
    }
}

//向玩家发送消息
exports.send_to_user = function (user_id, event, data) {
    var socket = users[user_id]
    if (!socket) return;
    socket.emit(event, data);
    console.log("user_id==>", user_id, "  event==>", event, "  data==>", JSON.stringify(data));
}

//发送给桌子
exports.send_to_table = function (table_id, event, data) {
    console.info("[MSG]  table_id ====>", table_id, " event ===>", event, "  data ===>", data)
    allio.in('' + table_id).emit(event, data)
}

//查找玩家是否在游戏中
exports.find_user = function (user_id) {
    var user_scoket = users[user_id]
    if (user_scoket && user_scoket.table) {
        return true
    }
    return false;
}

exports.get_user_info = function (user_id) {
    var user_scoket = users[user_id]
    if (user_scoket) {
        return user_scoket.user;
    }
    return null;
}
//踢掉所有的玩家
exports.kick_all_user = function () {
    for (var userid in users) {
        var socket = users[userid]
        if (socket) {
            socket.disconnect(true)
        }
    }
    users = {}
    total_users = 0;
}

/**
 * 同步玩家分数
 * @param {*} user_id 
 * @param {*} score 
 */
exports.sync_score = function (user_id, score) {
    var socket = users[user_id];
    if (socket) {
        var user = socket.user;
        if (user) {
            user.score += score;
        }
    }
}

//游戏结算
exports.game_conclude = function () {
    var top_info = []
    for (var user_id in users) {
        var user = users[user_id].user;
        var tmp = {
            user_id: Number(user_id),
            name: user.name,
            headimg: user.headimg,
            score: user.score,
            sex: user.sex,
            send: 0
        }
        top_info.push(tmp);
    }

    top_info.sort((a, b) => {
        return b.score - a.score;
    });

    var mail_tittle = string_service.get_mail_tittle(match_config.server_type, match_config.match_type);
    //WARN 排名是从0 开始的
    //发放邮件及，排名存档
    for (var i = 0; i < top_info.length; ++i) {
        var top = top_info[i];
        var award = get_top_award(i + 1);
        top.award = award;
        top.top_index = i + 1;
        //如果不是实物奖励，发送奖励
        //实物奖励，只发放邮件
        var award_keys = Object.keys(award)
        if (award_keys.length) {
            if (award_keys.indexOf("gold") != -1 || award_keys.indexOf("ingot") != -1) {
                var mail_content = string_service.get_mail_content(match_config.server_type, match_config.match_type, i + 1, true);
                var mail_key = top.user_id + '_' + match_config.server_type + '_' + match_config.match_type;
                mail_service.insert_sys_mail('', top.user_id, mail_tittle, mail_content, mail_key, award);
                top.send = 1;
            } else {
                //实物奖励不在有附件
                var mail_content = string_service.get_mail_content(match_config.server_type, match_config.match_type, i + 1, false);
                mail_service.insert_sys_mail('', top.user_id, mail_tittle, mail_content, mail_key, '');
            }
        }
        database_service.new_match_top_info(match_config.guid, top);
    }
    return top_info;
}

exports.start = function (io) {
    allio = io
    match_config = config_service.get_config();
    awards = match_config.awards[match_config.match_type]
}

//重载配置
exports.reload_config = function () {
    match_config = config_service.get_config();
    awards = match_config.awards[match_config.match_type];
    console.info("user manager reload ----->", match_config.guid)
}

/**
 * 清理所有的玩家，并压缩对应玩家的数据到对应的表
 */
exports.free_all = function () {
    //TODO 压缩玩家数据
    database_service.archive_match_user_info(match_config.guid, (err, rows) => {
        if (err) {
            console.error("archive match user info error:", err);
        }
        users = {}
        total_users = 0
    });
}

/**
 * 更新所有玩家的状态
 * @param {*} status 
 */
exports.update_all_user_status = function (status) {
    for (var a in users) {
        var user = users[a];
        database_service.update_match_user(a, 2, '', (r) => {
            if (!r) {
                console.log("Update user status failed:", a);
            }
        })
    }
}

/**
 * 获取排名奖励
 * @param {*} top_index 
 */
function get_top_award(top_index) {
    if (!awards[top_index]) {
        var tmp = awards[999];
        if (!tmp) {
            return award_info;
        }
        //参与奖暂时不用次规则 否则按照total_users来计算奖励
        var base_num = tmp[0];
        var offset = tmp[1];
        var award = tmp[2];
        return award;
    } else {
        var tmp = awards[top_index];
        var base_num = tmp[0];
        var offset = tmp[1];
        var award = clone(tmp[2]);
        var t = (Math.floor(total_users / total_users) + 1) * offset;
        for (var a in award) {
            award[a] *= t;
        }
        return award;
    }
    return {};
}

function clone(obj) {
    if (obj instanceof Object) {
        var new_obj = {};
        for (var a in obj) {
            if (typeof obj[a] == 'object') {
                new_obj[a] = clone(obj[a]);
            } else {
                new_obj[a] = obj[a];
            }
        }
        return new_obj;
    } else if (obj instanceof Array) {
        var new_obj = [];
        for (var i = 0; i < obj.length; ++i) {
            if (typeof obj[i] == 'object') {
                new_obj.push(clone(obj[i]))
            } else {
                new_obj.push(obj[i]);
            }
        }
        return new_obj;
    }
}