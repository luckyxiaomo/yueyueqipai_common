var mysql = require("mysql");
var crypto = require('./crypto');
var logger = require("./log").logger;

var pools = [];

var DB_TYPE={
    DB_FORK:'fork',
    DB_CLUSTER:'cluster'
}

//连接池索引
var DB_AREA ={
    GAME_DB:0,
    LOG_DB: 1,
}

var CLUSTER_CONFIG ={
    removeNodeErrorCount:9,
    defaultSelector:'ORDER'
}

/**
 * 初始化数据库服务
 * @param {*} log 
 */
exports.init = function(){
    //游戏库
    var game_config = process.ENV_CONFIG.GAME_DB_CONFIG;
    if(game_config.dbtype == DB_TYPE.DB_FORK){
        var game_pool = mysql.createPool(game_config.config);
        pools.push(game_pool);
    }
    else if(game_config.dbtype == DB_TYPE.DB_CLUSTER){
        var game_pool = mysql.createPoolCluster(CLUSTER_CONFIG);
        for(var name in game_config.config){
            game_pool.add(name,game_config.config[name]);
        }
        pools.push(game_pool);
    }else{
        logger.error("Init Game DB Failed ====>",JSON.stringify(game_config))
        return;
    }

    //日志库
    var log_config = process.ENV_CONFIG.LOG_DB_CONFIG;
    if(log_config.dbtype == DB_TYPE.DB_FORK){
        var log_pool = mysql.createPool(log_config.config)
        pools.push(log_pool);
    }
    else if(log_config.dbtype == DB_TYPE.DB_CLUSTER){
        var log_pool = mysql.createPoolCluster(CLUSTER_CONFIG);
        for(var name in log_config.config){
            log_pool.add(name,log_config.config[name]);
        }
        pools.push(log_pool);
    }else{
        logger.error("Init Log DB Failed ====>",JSON.stringify(log_config))
        return;
    }
}


///////////////////////////////////////////内部接口封装////////////////////////////////////////////////////
/**
 * 回调兼容
 */
function nop(a, b, c, d, e, f, g) {
    
}
/**
 * 带参数查询
 * @param {*} area 
 * @param {*} sql 
 * @param {*} params 
 * @param {*} callback 
 */
function query_with_params(area,sql,params,callback){
    callback =callback?callback:nop;
    pools[area].getConnection((err_conn,connection) =>{
        if(err_conn){
            callback(err_conn,null);
            return;
        }else{
            connection.query(sql,params,(err_query,rows) =>{
                connection.release()
                callback(err_query,rows);
                return;
            });
        }
    })
}
/**
 * 带参数promise查询
 * @param {*} area 
 * @param {*} sql 
 * @param {*} params 
 */
function query_sync_params(area,sql,params){
    return new Promise((resolve,reject) =>{
        pools[area].getConnection((err_conn,connection)=>{
            if(err_conn){
                logger.error("query_sync_params get connection ERROR:",err_conn);
                resolve(false);
            }else{
                connection.query(sql,params,(err_query,rows) =>{
                    connection.release();
                    if(err_query){
                        logger.error("query_sync_params query ERROR:",err_query);
                        resolve(false);
                    }else{
                        resolve(rows);
                    }
                });
            }
        });
    });
}
/**
 * 不带参数查询
 * @param {*} area 
 * @param {*} sql 
 * @param {*} callback 
 */
function query(area,sql,callback){
    callback =callback?callback:nop;
    pools[area].getConnection((err_conn,connection) =>{
        if(err_conn){
            callback(err_conn,null);
            return;
        }else{
            connection.query(sql,(err_query,rows) =>{
                connection.release()
                callback(err_query,rows);
                return;
            });
        }
    })
}
/**
 * 不带参数promise查询
 * @param {*} area 
 * @param {*} sql 
 * @param {*} callback 
 */
function query_sync(area,sql,callback){
    return new Promise((resolve,reject) =>{
        pools[area].getConnection((err_conn,connection)=>{
            if(err_conn){
                logger.error("query_sync get connection ERROR:",err_conn);
                resolve(false);
            }else{
                connection.query(sql,(err_query,rows) =>{
                    connection.release();
                    if(err_query){
                        logger.error("query_sync query ERROR:",err_query);
                        resolve(false);
                    }else{
                        resolve(rows);
                    }
                });
            }
        });
    });
}
/**
 * 调用存储过程
 * @param {*} area 
 * @param {*} proc_name 
 * @param {*} params 
 * @param {*} callback 
 */
function call_proc(area,proc_name,params,callback){
    callback =callback?callback:nop;
    var sql = 'call ' + proc_name + '(';
    for (var a in params) {
        if (a == params.length - 1) {
            sql += '?';
        } else {
            sql += '?,';
        }
    }
    sql += ');';

    pools[area].getConnection(function (err_conn, conn) {
        if (err_conn) {
            callback(err_conn, null);
            return;
        } else {
            conn.query(sql, params, function (qerr, values) {
                conn.release();
                callback(qerr, values);
                return;
            });
        }
    });
}

/**
 * promise调用存储过程
 * @param {*} area 
 * @param {*} proc_name 
 * @param {*} params 
 */
function call_proc_sync(area,proc_name,params){
    return new Promise((resolve,reject) =>{
        pools[area].getConnection(function(err_conn,connection){
            if(err_conn){
                logger.error(err_conn);
                resolve(false);
            }else{
                var sql = 'call ' + proc_name + '(';
                for (var a in params) {
                    if (a == params.length - 1) {
                        sql += '?';
                    } else {
                        sql += '?,';
                    }
                }
                sql += ');';
                connection.query(sql,params,(err,rows) =>{
                    connection.release();
                    if(err){
                        logger.error(err);
                        resolve(false);
                    }else{
                        resolve(rows);
                    }
                });
            }
        });
    });
}
///////////////////////////////////////////内部接口封装结束/////////////////////////////////////////////////

////////////////////////////////////////////游戏库区域///////////////////////////////////////////////
exports.is_account_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM accounts WHERE account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return
        }
        else {
            if (rows.length > 0) {
                callback(true);
            }
            else {
                callback(false);
            }
        }
    });
};

exports.create_account = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || password == null) {
        callback(false);
        return;
    }

    var psw = crypto.md5(password);
    var sql = 'INSERT INTO accounts(account,password) VALUES("{0}","{1}")';
    sql = sql.format(account, password);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                callback(false);
                return;
            }
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
};

exports.get_account_info = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM accounts WHERE account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        if (password != null) {
            var psw = crypto.md5(password);
            if (rows[0].password == psw) {
                callback(null);
                return;
            }
        }

        callback(rows[0]);
    });
};

exports.is_user_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM users WHERE account = "{0}" and `lock` = 0';
    sql = sql.format(account);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error(err);
            callback(false);
            return;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
}


exports.get_user_data = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,wx_open_id,name,headimg,lv,exp,coins,gems,roomid,`lock`,agent,invitation_code,agent_id,web_agent FROM users WHERE account = ? and `lock` =0';
    sql = mysql.format(sql,account,true);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM users WHERE userid = {0}';
    sql = sql.format(userid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems = function (userid, gems, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }

    var sql = 'UPDATE users SET gems = {0} WHERE userid = {1}';
    sql = sql.format(gems, userid)
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};

exports.get_gems = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems,coins,userid FROM users WHERE account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};

/**
 * 获取用户金币信息和日常信息
 */
exports.get_gems_daily_values = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems,coins,userid,daily_value,daily_clear_time FROM users,user_extro_info WHERE userid = user_id and account = "{0}"';
    sql = sql.format(account);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};

/**
 * 更新日常信息
 */
exports.update_daily_clear = function (user_id, daily_clear, daily_clear_time, callback) {
    var sql = '';
    daily_clear = JSON.stringify(daily_clear);
    if (daily_clear_time) {
        sql = "update user_extro_info set daily_value = '{0}',daily_clear_time ={1} where user_id = {2}"
        sql = sql.format(daily_clear, daily_clear_time, user_id);
    } else {
        sql = "update user_extro_info set daily_value = '{0}' where user_id = {1}"
        sql = sql.format(daily_clear, user_id);
    }
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("UPDATE DAILY CLEAR ERROR:", err.stack);
            callback(false);
            return;
        }
        callback(true);
        return;
    });
}

exports.get_user_history = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM users WHERE userid = {0}';
    sql = sql.format(userId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        var history = rows[0].history;
        if (history == null || history == "") {
            callback(null);
        }
        else {
            // logger.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }
    });
};

exports.get_user_history2 = function (data, callback) {
    param = [];
    param.push(data.user_id);
    param.push(data.page);
    param.push(data.server_type);
    param.push(data.clubid);
    param.push(data.ts);
    call_proc(DB_AREA.GAME_DB,'get_user_history', param, callback);
}

exports.update_user_history = function (userId, history, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || history == null) {
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE users SET roomid = null, history = "{0}" WHERE userid = {1}';
    sql = sql.format(history, userId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
};

//获取房间游戏结果
exports.get_games_of_room = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM games_archive WHERE room_uuid = "{0}"';
    sql = sql.format(room_uuid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows);
    });
};
//获取游戏房间结果
exports.get_games_of_room2 = function (room_uuid, callback) {
    param = [];
    param.push(room_uuid);
    call_proc(DB_AREA.GAME_DB,'get_game_of_room', param, callback);
}

exports.get_detail_of_game = function (room_uuid, index, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || index == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM games_archive WHERE room_uuid = "{0}" AND game_index = {1}';
    sql = sql.format(room_uuid, index);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}
//获取游戏详情
exports.get_detail_of_game2 = function (data, callback) {
    param = [];
    param.push(data.room_uuid);
    param.push(data.index);
    call_proc(DB_AREA.GAME_DB,'get_detail_of_game', param, callback);
}

exports.create_user = function (account, name, coins, gems, sex, headimg, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || name == null || coins == null || gems == null) {
        callback(false);
        return;
    }
    if (headimg) {
        headimg = '"' + headimg + '"';
    }
    else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'INSERT INTO users(account,name,coins,gems,sex,headimg) VALUES("{0}","{1}",{2},{3},{4},{5})';
    sql = sql.format(account, name, coins, gems, sex, headimg);
    logger.debug(sql);
    //logger.log(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        callback(true);
    });
};

exports.update_user_info = function (userid, name, headimg, sex, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    if (headimg) {
        headimg = '"' + headimg + '"';
    }
    else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
    sql = sql.format(name, headimg, sex, userid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error(err);
            callback(null);
            return;
        }
        callback(rows);
    });
};

exports.get_user_base_info = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM users WHERE userid={0}';
    sql = sql.format(userid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error(err)
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.is_room_exist = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId)
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error(err)
            callback(false);
            return
        }
        else {
            callback(rows.length > 0);
        }
    });
};

exports.cost_ingot = function (user_id, lose_ingot, callback) {
    call_proc(DB_AREA.GAME_DB,'lose_ingot', [user_id, lose_ingot], callback);
}


exports.cost_gold = function (user_id, gold_value, callback) {
    call_proc(DB_AREA.GAME_DB,'lose_gold', [user_id, gold_value], callback);
}
exports.set_room_id_of_user = function (userId, roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE users SET roomid = {0} WHERE userid = {1}';
    if (roomId != null) {
        roomId = '"' + roomId + '"';
        sql = sql.format(roomId, userId);
    } else {
        sql = 'UPDATE users SET roomid = null WHERE userid = {0}';
        sql = sql.format(userId);
    }
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        else {
            callback(rows.length > 0);
            return;
        }
    });
};

exports.get_room_id_of_user = function (userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT roomid FROM users WHERE userid = {0}';
    sql = sql.format(userId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }
        else {
            if (rows.length > 0) {
                callback(rows[0].roomid);
            }
            else {
                callback(null);
            }
        }
    });
};


//数据库创建房间
exports.create_room = function (roomId, conf, ip, port, create_time, server_type, server_id, agent_id, ip_info,callback) {
    callback = callback == null ? nop : callback;
    var sql = '';
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    var agent_expires_time = create_time + 3600 * 2;
    if (agent_id) {
        sql = "INSERT INTO rooms(uuid,id,base_info,ip,port,create_time,server_type,server_id,agent_user_id,agent_expires_time,seat_info,score_info,change_info,country,area,city) \
                    VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},{7},{8},{9},'[]','[]','{}','{10}','{11}','{12}')";
        sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, server_type, server_id, agent_id, agent_expires_time,ip_info.country,ip_info.area,ip_info.city);

    } else {
        sql = "INSERT INTO rooms(uuid,id,base_info,ip,port,create_time,server_type,server_id,seat_info,score_info,change_info,country,area,city) \
                    VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},{7},'[]','[]','{}','{8}','{9}','{10}')";
        sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, server_type, server_id,ip_info.country,ip_info.area,ip_info.city);
    }
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, row) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }
        else {
            callback(uuid);
        }
    });
};

exports.get_room_uuid = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT uuid FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, [roomId], function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }
        else {
            callback(rows[0].uuid);
        }
    });
};

//更新座位信息old
exports.update_seat_info = function (roomId, seatIndex, userId, icon, name, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex, userId, icon, name, roomId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, row) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
}


//更新房间基础信息
exports.update_room_base_info = function (room_uuid, base_info, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE rooms SET base_info='{0}' WHERE uuid='{1}'";
    sql = sql.format(JSON.stringify(base_info), room_uuid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, row) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
}



//更新座位信息New
exports.update_seat_info2 = function (data, callback) {
    param = [];
    param.push(data.uuid);
    param.push(JSON.stringify(data.seat_info));
    param.push(JSON.stringify(data.watch_seat_info));
    call_proc(DB_AREA.GAME_DB,'update_seat_info', param, callback);
}

exports.update_num_of_turns = function (roomId, numOfTurns, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE rooms SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns, roomId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, row) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
};


exports.update_next_button = function (roomId, nextButton, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE rooms SET next_button = {0} WHERE id = "{1}"'
    sql = sql.format(nextButton, roomId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, row) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
};

exports.get_room_addr = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false, null, null);
        return;
    }

    var sql = 'SELECT base_info,ip,port,server_type,server_id FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false, null, null);
            logger.error(err);
            return;
        }
        if (rows.length > 0) {
            callback(true, rows[0].ip, rows[0].port, rows[0].server_type, rows[0].server_id, rows[0].base_info);
        }
        else {
            callback(false, null, null);
        }
    });
};


exports.get_room_data = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM rooms WHERE id = "{0}"';
    sql = sql.format(roomId);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }
        if (rows.length > 0) {
            rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
            callback(rows[0]);
        }
        else {
            callback(null);
        }
    });
};
//删除房间，压缩到指定的表
exports.delete_room = function (data, callback) {
    callback = callback == null ? nop : callback;
    param = []
    param.push(data.room_uuid);
    param.push(data.create_time);
    param.push(data.zip_reason);
    param.push(data.zip_time);
    param.push(JSON.stringify(data.user_info));
    call_proc(DB_AREA.GAME_DB,'achive_room', param, callback);
}

exports.create_game = function (room_uuid, index, base_info, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
    sql = sql.format(room_uuid, index, base_info);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(null);
            logger.error(err);
            return;
        }
        else {
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "DELETE FROM games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
}

exports.archive_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "INSERT INTO games_archive(SELECT * FROM games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            exports.delete_games(room_uuid, function (ret) {
                callback(ret);
            });
        }
    });
}

exports.update_game_action_records = function (room_uuid, index, actions, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE games SET action_records = '{0}' WHERE room_uuid = '{1}' AND game_index = {2}";
    sql = sql.format(actions, room_uuid, index)
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
};

exports.update_game_result = function (room_uuid, index, result, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || result) {
        callback(false);
    }

    result = JSON.stringify(result);
    var sql = "UPDATE games SET result = '{0}' WHERE room_uuid = {1} AND game_index = {2}";
    sql = sql.format(result, room_uuid, index);
    logger.debug(sql);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            callback(false);
            logger.error(err);
            return;
        }
        else {
            callback(true);
        }
    });
};


//proc store game
exports.init_game_base_info = function (data, callback) {
    var param = [];
    param.push(data.uuid);
    param.push(data.game_index);
    param.push(data.create_time);
    param.push(JSON.stringify(data.base_info));
    param.push(JSON.stringify(data.holds));
    param.push(JSON.stringify(data.folds));
    param.push(JSON.stringify(data.actions));
    param.push(JSON.stringify(data.result));
    param.push(JSON.stringify(data.statistic));
    param.push(JSON.stringify(data.change_info));
    call_proc(DB_AREA.GAME_DB,'poker_dump_game_base', param, callback);
};

exports.update_game_info = function (data, callback) {
    var param = [];
    param.push(data.room_uuid);
    param.push(data.game_index);
    param.push(JSON.stringify(data.holds));
    param.push(JSON.stringify(data.folds));
    param.push(JSON.stringify(data.actions));
    param.push(JSON.stringify(data.change_info));
    call_proc(DB_AREA.GAME_DB,'poker_update_game_info', param, callback);
};

exports.load_game_from_db = function (data, callback) {
    var param = [];
    param.push(data);
    call_proc(DB_AREA.GAME_DB,'poker_load_game', param, callback);
};

exports.change_room_info = function (data, callback) {
    var param = []
    param.push(data.room_id);
    param.push(data.ip);
    param.push(data.port);
    param.push(data.server_id)
    call_proc(DB_AREA.GAME_DB,'change_room_info', param, callback);
}
//更新房间信息
exports.update_room_info = async function (data, callback) {
    var param = []
    param.push(data.room_uuid);
    param.push(data.game_index);
    //兼容以前的游戏
    if (data.less_begin == null) {
        data.less_begin = 0;
    }
    param.push(data.less_begin);
    param.push(JSON.stringify(data.score_list));
    if (!data.change_info) {
        data.change_info = '';
    }
    param.push(JSON.stringify(data.change_info));
    call_proc(DB_AREA.GAME_DB,'update_room_info', param, callback);
}

//更新房间信息
exports.async_update_room_info = async function (data) {
    var param = []
    param.push(data.room_uuid);
    param.push(data.game_index);
    //兼容以前的游戏
    if (data.less_begin == null) {
        data.less_begin = 0;
    }
    param.push(data.less_begin);
    param.push(JSON.stringify(data.score_list));
    if (!data.change_info) {
        data.change_info = '';
    }
    param.push(JSON.stringify(data.change_info));
    return await call_proc_sync(DB_AREA.GAME_DB,'update_room_info',param);
}

//增加结果，压缩房间信息
exports.add_result_achive_game = function (data, callback) {
    var param = []
    param.push(Number(data.force));
    param.push(data.room_uuid);
    param.push(data.game_index);
    // param.push(data.create_time);
    param.push(Math.floor(Date.now()/1000));
    param.push(JSON.stringify(data.result));
    call_proc(DB_AREA.GAME_DB,'add_result_achive_game', param, callback);
}

//尝试注册或者更新账户
exports.try_create_or_update_user = function (data, callback) {
    var param = []
    param.push(data.account);
    param.push(data.name);
    param.push(data.sex);
    param.push(data.headimgurl);
    param.push(data.platform);
    param.push(data.channal);
    param.push(data.now);
    param.push(data.wx_openid);
    param.push(data.web_call);
    param.push(data.agent_id)
    param.push(data.ingot);
    param.push(data.gold);
    call_proc(DB_AREA.GAME_DB,'create_or_update_user', param, callback);
}

//创建新的订单
exports.create_pay_order = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.good_sn);
    param.push(data.suffix);
    param.push(data.good_count);
    param.push(data.order_money);
    param.push(data.award_gold);
    param.push(data.extro_gold);
    param.push(data.award_ingot);
    param.push(data.extro_ingot)
    param.push(data.pay_platform);
    call_proc(DB_AREA.GAME_DB,'create_pay_order', param, callback);
}

//支付成功
exports.pay_success = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.good_sn);
    param.push(data.pay_platform);
    param.push(data.order_id);
    param.push(data.pay_id);
    param.push(data.pay_count);
    param.push(data.app_pay_time);
    call_proc(DB_AREA.GAME_DB,'pay_success', param, callback);
}

//投诉建议
exports.try_create_new_advice = function (data, callback) {
    // account:account,
    // advice_type:advice_type,
    // advice_game:advice_game,
    // advice_platform:advice_platform,
    // msg:msg
    var param = [];
    param.push(data.account);
    param.push(data.advice_type);
    param.push(data.advice_game);
    param.push(data.advice_platform);
    param.push(data.msg);
    call_proc(DB_AREA.GAME_DB,'create_new_advice', param, callback);
}

//查询投诉建议
exports.try_find_advice = function (data, callback) {
    // account:account,
    // page:page
    var param = [];
    param.push(data.account);
    param.push(data.page);
    call_proc(DB_AREA.GAME_DB,'find_advice', param, callback);
}

//标记投诉建议已解决
exports.try_solve_advice = function (data, callback) {
    // account:account,
    // ad_id:ad_id
    var param = [];
    param.push(data.account);
    param.push(data.ad_id);
    call_proc(DB_AREA.GAME_DB,'solve_advice', param, callback);
}

//更新房间可变信息
exports.update_room_change_info = function (data, callback) {
    var param = [];
    param.push(data.room_uuid);
    param.push(JSON.stringify(data.change_info));
    call_proc(DB_AREA.GAME_DB,'update_room_change_info', param, callback);
}

//获取用户邮件
exports.get_user_mail = function (data, callback) {
    var param = [];
    param.push(data.user_account);
    param.push(data.page);
    call_proc(DB_AREA.GAME_DB,'get_user_mail', param, callback);
}

//添加用户邮件
exports.add_user_mail = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.sender_id);
    param.push(data.sender_name);
    param.push(data.mail_type);
    param.push(data.mail_tittle);
    param.push(data.mail_content);
    param.push(data.mail_key);
    param.push(JSON.stringify(data.mail_attach));
    param.push(data.end_time);
    call_proc(DB_AREA.GAME_DB,'add_user_mail', param, callback);
}

//删除用户邮件
exports.del_user_mail = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.mail_id);
    param.push(data.archive_reason);
    call_proc(DB_AREA.GAME_DB,'del_user_mail', param, callback);
}

//读取邮件
exports.update_mail_status = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.mail_id);
    param.push(data.status);
    call_proc(DB_AREA.GAME_DB,'update_mail_status', param, callback);
}

//检测邮件领取奖励状态
exports.check_mail_award = function (data, callback) {
    var param = []
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.mail_id);
    call_proc(DB_AREA.GAME_DB,'check_mail_award', param, callback)
}
//修改消息
exports.modified_message = function (data, callback) {

}
//获取消息
exports.get_message = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.page);
    call_proc(DB_AREA.GAME_DB,'get_message', param, callback)
}

//加载玩家信息
exports.load_user_info = function (user_id, callback) {
    var sql = "select lv,exp,lucky,online_time,daily_value,statistic,daily_clear_time from users,user_extro_info where users.userid = user_extro_info.user_id and users.userid = {0};";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("LOAD USER INFO ERROR:", err.stack);
            callback(false, null);
            return;
        }
        callback(true, rows[0]);
    });
}

//加载玩家额外信息
exports.get_user_extro_info = function (account, callback) {
    var sql = "select daily_value,statistic,daily_clear_time from users,user_extro_info where users.userid = user_extro_info.user_id and users.account = '{0}';";
    sql = sql.format(account);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("LOAD USER INFO ERROR:", err.stack);
            callback(false, null);
            return;
        }
        if(rows.length == 0 ){
            callback(false)
            return;
        }
        callback(true, rows[0]);
    });
}

//获取玩家认证信息
exports.get_user_identify_info = function(account,callback){
    var sql = "select user_extro_info.user_id,identify,real_name,id_id,phone from users,user_extro_info where users.userid = user_extro_info.user_id and users.account = '{0}'";
    sql = sql.format(account);
    logger.log(sql)
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("LOAD IDENTIFY INFO ERROR:", err.stack);
            callback(false, null);
            return;
        }
        if(rows.length ==0){
            callback(false,null);
            return;
        }
        callback(true, rows[0]);
    });
}
//实名认证记录
exports.identify_user = function(user_id,real_name,id_id,phone,callback){
    var sql = "update user_extro_info set identify =1,real_name ='{0}',id_id='{1}',phone ='{2}' where user_id = {3}";
    sql = sql.format(real_name,id_id,phone,user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("IDENTIFY ERROR:", err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}

//更新玩家信息
exports.update_user_extro_info = function (user_id, user_info, callback) {
    var param = [];
    param.push(user_id);
    param.push(user_info.lv);
    param.push(user_info.exp);
    param.push(user_info.lucky);
    param.push(user_info.online_time);
    param.push(JSON.stringify(user_info.daily_value));
    param.push(JSON.stringify(user_info.statistic));
    param.push(user_info.daily_clear_time);
    call_proc(DB_AREA.GAME_DB, 'update_user_info', param, callback);
}

//设置邀请码
exports.add_invitation_code = function (account, invitation_code, kind_type, callback) {
    var param = [];
    param.push(account);
    param.push(invitation_code);
    param.push(kind_type);
    call_proc(DB_AREA.GAME_DB, 'add_inviation', param, callback);
}

//绑定代理ID
exports.update_user_agent = function (bind_userid,agent_id,agent_user_id,callback){
    var sql = 'update users set agent_id = "{0}", invitation_code ="{1}" where userid = {2}';
    sql = sql.format(agent_id,agent_user_id,bind_userid);
    query(DB_AREA.GAME_DB, sql,function(err,rows){
        if(err){
            logger.error("db update_user_agnet failed.",err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}

//获取自己的邀请码状态
exports.invitation_status = function (account, callback) {
    var param = [];
    param.push(account);
    call_proc(DB_AREA.GAME_DB, 'inviation_status', param, callback);
}

////后台相关存储过程
//后台获取玩家信息
exports.web_get_user_data_by_userid = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,name,headimg,coins,gems,roomid,reg_time,`lock`,agent FROM users WHERE userid = {0}';
    sql = sql.format(userid);
    logger.debug(sql);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error(err.track);
            callback(null);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};
//后台添加用户房卡
exports.web_add_user_ingot = function (data, callback) {
    // sender_id:sender_id,
    // user_id:user_id,
    // ingot:ingot,
    var param = [];
    param.push(data.sender_id);
    param.push(data.user_id);
    param.push(data.ingot);
    call_proc(DB_AREA.GAME_DB, 'web_add_user_ingot', param, callback);
}
//添加用户邮件
exports.web_add_user_mail = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.user_id);
    param.push(data.sender_id);
    param.push(data.sender_name);
    param.push(data.mail_type);
    param.push(data.mail_tittle);
    param.push(data.mail_content);
    param.push(data.mail_key);
    param.push(JSON.stringify(data.mail_attach));
    param.push(data.end_time);
    call_proc(DB_AREA.GAME_DB, 'add_user_mail', param, callback);
}
//添加用户金币
exports.web_add_user_gold = function (data, callback) {
    // sender_id:sender_id,
    // user_id:user_id,
    // gold:gold,
    var param = [];
    param.push(data.sender_id);
    param.push(data.user_id);
    param.push(data.gold);
    call_proc(DB_AREA.GAME_DB, 'web_add_user_gold', param, callback);
}
////转盘相关信息
exports.route_state = function (data, callback) {
    var param = [];
    param.push(data.account);
    call_proc(DB_AREA.GAME_DB, 'route_state', param, callback);
}

exports.do_route = function (user_id, callback) {
    var param = [];
    param.push(user_id)
    call_proc(DB_AREA.GAME_DB, 'do_route', param, callback);
}

exports.load_route_config = function (callback) {
    var sql = 'select id,route_index,route_ood,max_hit,ingot_value,gold_value,today_hit,today_time,route_name,img from route_config;';
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error(err.track);
            callback(null);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows);
    });
}

exports.update_hit_value = function (data, callback) {
    var param = [];
    call_proc(DB_AREA.GAME_DB, 'update_hit_value', param, callback);
}


exports.get_userid_by_account = function (account, callback) {
    var sql = "select userid from users where account = '{0}'";
    sql = sql.format(account);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("GET USERID BY ACCOUNT ERROR:", err.stack);
            callback(false);
            return;
        }
        callback(rows);
        return;
    })
}

exports.update_route_hit_info = function (hit_index, hit_times) {
    var sql = 'update route_config set today_hit = {0}  where route_index = {1}';
    sql = sql.format(hit_times, hit_index);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("UPDATE ROUTE HIT TIME ERROR:", err.stack);
        }
    });
}

exports.close_today_route_data = function (now, callback) {
    var param = [];
    param.push(now);
    call_proc(DB_AREA.GAME_DB, 'close_route_data', param, callback);
}


exports.add_ingot = function (user_id, add_value, callback) {
    var sql = "update users set gems = gems + {0} where userid = {1}";
    sql = sql.format(add_value, user_id);
    // logger.log(sql)
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("ADD INGOT ERROR:", err.stack);
            callback(false);
            return;
        } else {
            sql = 'select gems,platform,channel,agent_id from users where userid = {0}';
            sql = sql.format(user_id);
            query(DB_AREA.GAME_DB, sql, function (err, rows) {
                if (err) {
                    logger.error("ADD INGOT FIND INGOT ERROR:", err.stack);
                    callback(false);
                    return;
                }
                callback(rows);
                return;
            });
        }
    });
}

exports.add_gold = function (user_id, add_value, callback) {
    var sql = "update users set coins = coins + {0} where userid = {1}";
    sql = sql.format(add_value, user_id);
    // logger.log(sql);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("ADD GOLD ERROR:", err.stack);
            callback(false);
            return;
        } else {
            sql = 'select coins,platform,channel,agent_id from users where userid = {0}';
            sql = sql.format(user_id);
            query(DB_AREA.GAME_DB, sql, function (err, rows) {
                if (err) {
                    logger.error("ADD GOLD FIND INGOT ERROR:", err.stack);
                    callback(false);
                    return;
                }
                callback(rows);
                return;
            });
        }
    });
}

/**
 * 废弃
 * @param {*} user_id 
 * @param {*} callback 
 */
exports.add_route_time = function (user_id, callback) {
    var sql = 'update user_extro_info set route_time = unix_timestamp(now()) where user_id  = {0}';
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("ADD ROUTE TIME ERROR.", err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}

/**
 * 消耗转盘次数
 * @param {*} user_id 
 * @param {*} callback 
 */
exports.cost_route_counts = function(user_id,callback){
    var param =[]
    param.push(user_id)
    call_proc(DB_AREA.GAME_DB,'cost_route_counts',param,callback)
}

/**
 * 奖励
 * @param {*} user_id 
 * @param {*} count 
 * @param {*} callback 
 */
exports.add_route_counts = function(user_id,count,callback){
    var param =[]
    param.push(user_id)
    param.push(count)
    call_proc(DB_AREA.GAME_DB,'add_route_counts',param,callback)
}

exports.get_user_lucky = function (user_id, callback) {
    var sql = "select lucky,name from users where userid = {0}";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("GET USER LUCKY ERROR:", err.stack);
            callback(false);
            return;
        }
        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(rows[0]);
        return;
    })
}

//增加用户幸运值
exports.add_user_lucky = function (user_id, value) {
    var sql = "update users set lucky = lucky + {0} where userid = {1}";
    sql = sql.format(value, user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("ADD USER LUCKY ERROR:", err.stack);
            return;
        }
    })
}

//减少用户幸运值
exports.cost_user_lucky = function (user_id, value) {
    var sql = "update users set lucky = lucky - {0} where userid = {0}";
    sql = sql.format(value, user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("COST USER LUCKY ERROR:", err.stack);
            return;
        }
    });
}

//获取全局变量
exports.get_global_value = function (global_key, value_type, callback) {
    var sql = '';
    if (value_type == 1) {
        sql = "select global_int_value from global_settings where global_key = '{0}'";
    } else {
        sql = "select global_str_value from global_settings where global_key = '{0}'";
    }
    sql = sql.format(global_key);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("GET GOBAL VALUE ERROR:", err.stack);
            callback(false);
        } else {
            callback(rows)
        }
    });
}
//替换全局变量
exports.replace_global_value = function (global_key, value_type, value, callback) {
    var sql = '';
    if (value_type == 1) {
        sql = "replace into global_settings values('{0}',{1},null,null)";
    } else {
        sql = "replace into global_settings values('{0}',null,'{1}',null)";
    }

    sql = sql.format(global_key, value)
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("REPLACE GLOBAL VALUE ERROR:", err.stack);
            callback(false);
        } else {
            callback(true);
        }
    });

}

//替换全局变量
exports.replace_global_setting = function (global_key, int_value, str_value, str_value2, callback) {
    var sql = "replace into global_settings values('{0}',{1},'{2}','{3}')";
    sql = sql.format(global_key, int_value, str_value, str_value2)
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("REPLACE GLOBAL SETTING ERROR:", err.stack);
            callback(false);
        } else {
            callback(true);
        }
    });

}

exports.check_account = function (account, callback) {
    var sql = "select userid from users where account = '{0}'";
    sql = sql.format(account);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("CHECK ACCOUNT ERROR:", err.stack);
            callback(false);
            return;
        }
        if (rows.length) {
            if(rows[0].userid){
                callback(true);
                return;
            }
            callback(false);
            return;
        } else {
            callback(false);
            return;
        }
    });
}

//获取玩家Userid
exports.account_user_id = function(account,callback){
    var sql = "select userid from users where account ='{0}'"
    sql = sql.format(account)
    query(DB_AREA.GAME_DB, sql,(err,rows) =>{
        if(err){
            logger.error("Check Account Error:",err.stack);
            callback(null);
            return;
        }
        if(rows[0] && rows[0].userid){
            callback(rows[0].userid);
            return;
        }else{
            callback(null);
            return;
        }
    })
}
//加载数据库存放的票据
exports.load_ticket = function (callback) {
    var sql = 'select global_key,global_int_value,global_str_value,global_str_value2 from global_settings where global_key like "wechat_%";'
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("LOAD TICKET ERROR:", err.stack);
            callback(false, null);
            return;
        } else {
            callback(true, rows);
            return;
        }
    })
}

/**
 * 根据userid获取玩家信息
 */
exports.get_user_info_byid = function (user_id, callback) {
    var sql = "select * from users,user_extro_info where users.userid = user_extro_info.user_id  and userid = {0} and `lock` = 0";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error(err);
            callback(null);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
}

/**
 * 根据account获取玩家信息
 */
exports.get_user_info_byac = function (account, callback) {
    var sql = "select * from users,user_extro_info where users.userid = user_extro_info.user_id  and users.account = '{0}'";
    sql = sql.format(account);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error(err);
            callback(null);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
        sql = 'update users set login_time = unix_timestamp(now()) where account ="{0}" '
        sql = sql.format(account)
        query(DB_AREA.GAME_DB,sql,function(err1,rows){
            if(err){
                logger.error("update user login_time failed.",err1.stack);
            }
        })
    });
}

exports.get_match_user_info = function(account,callback){
    var sql = "select * from users where account = '{0}'"
    sql = sql.format(account)
    query(DB_AREA.GAME_DB,sql,function(err,rows){
        if(err){
            logger.error("GET NATCH USER INFO FAILD:",err)
            callback(null);
            return;
        }
        callback(rows[0]);
    })
}


//获得代开房间列表
exports.get_agent_room = function (agent_user_id, callback) {
    var sql = "select id,base_info,num_of_turns,agent_expires_time from rooms where agent_user_id={0}";
    sql = sql.format(agent_user_id);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("GET AGENT ROOM ERROR.", err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}


//获得代开房间信息
exports.get_room_by_id = function (room_id, callback) {
    var sql = "select uuid,base_info,seat_info,create_time,num_of_turns,agent_user_id from rooms where id='{0}'";
    sql = sql.format(room_id);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("GET AGENT ROOM ERROR.", err.stack);
            callback(false);
            return;
        }
        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(rows[0]);
    });
}


//微信支付接口
exports.wechat_pay_order = function(data,callback){
    // user_id:0,
    // out_trade_no:out_trade_no,
    // good_sn:0,
    // detail:data
    var param =[]
    param.push(data.user_id)
    param.push(data.platform)
    param.push(data.out_trade_no)
    param.push(data.good_sn)
    param.push(data.attach)
    param.push(JSON.stringify(data.detail))
    param.push(data.order_money);
    param.push(data.gold);
    param.push(data.extro_gold);
    param.push(data.ingot);
    param.push(data.extro_ingot)
    param.push(data.agent_id)
    param.push(data.unionid)
    param.push(data.from_where)
    param.push(data.mch_id)
    param.push(data.appid)
    // logger.log(param)
    call_proc(DB_AREA.GAME_DB, "wechat_pay_order",param,callback);
}
//加载微信支付信息
exports.load_wechat_payinfo = function(data,callback){
    var param =[]
    param.push(data.out_trade_no);
    param.push(data.attach);
    param.push(data.status);
    call_proc(DB_AREA.GAME_DB, 'load_wechat_pay',param,callback);
}

exports.load_wechat_payinfo_alone = function(data,callback){
    var param =[];
    param.push(data.out_trade_no);
    call_proc(DB_AREA.GAME_DB,"load_wechat_pay_alone",param,callback);
}

//支付客户端回调成功
exports.wechat_pay_success = function(data,callback){
    var param =[];
    param.push(data.user_id);
    param.push(data.id);
    param.push(data.out_trade_no);
    param.push(data.ingot);
    param.push(data.gold);
    if(data.transaction_id){
        param.push(data.transaction_id);
    }else{
        param.push('');
    }

    call_proc(DB_AREA.GAME_DB, 'wechat_pay_success',param,callback);
}

//后台支付成功验证，不再发任何货币，只记录相关信息
exports.agent_wechat_pay_success = function(id,trade_no,status,transaction_id,callback){
    var sql = "update wechat_pay_order set `status` = {0},transaction_id ='{1}' where id ={2} and out_trade_no ='{3}'";
    sql = sql.format(status,transaction_id,id,trade_no);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("agent_wechat_pay_sucess ERROR.", err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}

//修改微信支付状态
exports.update_wechat_pay_status = function(id,trade_no,status,transaction_id,callback){
    var sql = "update wechat_pay_order set `status` = {0},transaction_id ='{1}' where id ={2} and out_trade_no ='{3}'";
    sql = sql.format(status,transaction_id,id,trade_no)
    // logger.log(sql)
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error("update_wechat_pay_status ERROR.", err.stack);
            callback(false);
            return;
        }
        callback(true);
    });
}

exports.load_unfinish_wechat_order = function(user_id,callback,limit){
    var sql = "select id,out_trade_no,detail,mch_id,appid from wechat_pay_order where (`status`=0 or `status`=1)\
     and (from_where= 'wechat' or from_where = 'wechat_h5') and user_id = {0}";
    sql = sql.format(user_id);

    logger.log(sql)
    query(DB_AREA.GAME_DB,sql,(err,rows) =>{
        if(err){
            logger.log("load_unfinish_wechat_order ERROR:",err.stack);
            callback([]);
            return;
        }
        callback(rows);
        return;
    })
}

exports.add_wechat_pay_order_check_flag = function(o_id){
    var sql = "update wechat_pay_order set `status` = -1 where id = {0}";
    sql = sql.format(o_id);
    query(DB_AREA.GAME_DB,sql,(err,rows)=>{
        if(err){
            logger.error("add_wechat_pay_order_check_flag ERROR:",err.stack);
        }
    });
}

exports.get_user_platchan = function(user_id,account,callback){
    var sql =''
    if(user_id){
        sql = 'select platform,channel,CAST(agent_id AS UNSIGNED INTEGER) as agent_id from users where userid ={0}'
        sql = sql.format(user_id)
    }
    if(account){
        sql = 'select platform,channel,CAST(agent_id AS UNSIGNED INTEGER) as agent_id from users where account ="{0}"'
        sql = sql.format(account)
    }
    logger.info('get user platchan --->',sql)
    if(sql !=''){
        query(DB_AREA.GAME_DB,sql,function(err,rows){
            if(err){
                logger.error("get user platchan failed.",err.stack)
                callback(false);
                return;
            }
            callback(rows[0]);
        }); 
    }
}

exports.load_room_simple_info = function(room_id,callback){
    var sql ='select uuid,id,server_type,server_id from rooms where id = "{0}"';
    sql = sql.format(room_id)
    query(DB_AREA.GAME_DB,sql,function(err,rows){
        if(err){
            logger.error("load room simple info failed.",err.stack);
            callback(false);
            return;
        }
        callback(rows[0]);
        return;
    });
}

exports.web_archive_room = function(room_uuid,agent_id,callback){
    var param =[];
    param.push(room_uuid);
    param.push(agent_id);
    call_proc(DB_AREA.GAME_DB, "web_archive_room",param,callback);
}


exports.load_agent_users = function(account,page,page_size,callback){
    var param =[];
    param.push(account);
    param.push(page);
    param.push(page_size)
    call_proc(DB_AREA.GAME_DB, 'load_agent_users',param,callback);
}

exports.add_room_cost = function(data,callback){
    var sql = "update rooms set cost_ingot = cost_ingot + {0},cost_gold = cost_gold +{1} where uuid = '{2}'";
    sql = sql.format(data.ingot,data.gold,data.uuid);

    query(DB_AREA.GAME_DB,sql,function(err,rows){
        if(err){
            logger.error("ADD ROOM COST failed.",err.stack);
            return;
        }
        if(rows.affectedRows != 1){
            logger.warn("ADD ROOM COST AFFECTED 0.")
        }
    });
}

exports.add_room_cost_by_room_id = function(data,callback){
    var sql = "update rooms set cost_ingot = cost_ingot + {0},cost_gold = cost_gold +{1} where id = '{2}'";
    sql = sql.format(data.ingot,data.gold,data.room_id);

    query(DB_AREA.GAME_DB,sql,function(err,rows){
        if(err){
            logger.error("ADD ROOM COST BY ROOM ID failed.",err.stack);
            return;
        }
        if(rows.affectedRows != 1){
            logger.warn("ADD ROOM COST BY ROOM ID AFFECTED 0.")
        }
    });
}

/**
 * 更新房间状态信息
 */
exports.update_room_status = function(room_uuid,last_begin_time,current_status){
    var sql  = "";
    if(last_begin_time){
        sql = "update rooms set last_begin_time = {0},current_status ={1} where uuid = '{2}'";
        sql = sql.format(last_begin_time,current_status,room_uuid);
    }else{
        sql = "update rooms set current_status ={0} where uuid = '{1}'"
        sql = sql.format(current_status,room_uuid)
    }

    query(DB_AREA.GAME_DB, sql,function(err,rows){
        if(err){
            logger.error("UPDATE ROOM STATUS FAILED.",err.stack);
            return;
        }
        if(rows.affectedRows != 1){
            logger.warn("UPDATE ROOM STATUS AFFECTED 0.")
        }
    })
}

/**
 * 全局补偿状态
 */
exports.global_award_status = function(account,callback){
    var param =[]
    param.push(account)
    call_proc(DB_AREA.GAME_DB, "global_award_status",param,callback);
}

/**
 * 领取全局补偿
 */
exports.global_award_get = function(account,callback){
    var param =[]
    param.push(account)
    call_proc(DB_AREA.GAME_DB, "global_award_get",param,callback)
}

/**
 * 领取全局奖励
 */
exports.add_global_award = function(user_id,ingot,gold,end_time,callback){
    var param =[]
    param.push(user_id)
    param.push(ingot)
    param.push(gold)
    param.push(end_time)
    call_proc(DB_AREA.GAME_DB, 'add_global_award',param,callback);
}

/**
 * 更新领取全局奖励次数
 */
exports.update_global_award_times = function(award_id){
    var sql = 'update global_award set award_times = award_times +1 where id = {0}';
    sql = sql.format(award_id)
    query(DB_AREA.GAME_DB, sql,(err,rows)=>{
        if(err){
            logger.error("UPDATE GLOBAL_AWARD AWARD_TIMES Failed:",err.stack);
            return;
        }
    })
}

/**
 * 后台接口-添加消息
 */
exports.web_add_message = function (data, callback) {
    var param = [];
    param.push(data.type);
    param.push(data.seq);
    param.push(data.loop_times);
    param.push(data.open_time);
    param.push(data.end_time);
    param.push(data.msgtext);
    param.push(data.create_id);
    call_proc(DB_AREA.GAME_DB, 'add_message', param, callback);
}

/**
 * 钻石转房卡
 */
exports.try_gold_to_ingot = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.gold);
    param.push(data.rate);
    call_proc(DB_AREA.GAME_DB, 'try_gold_to_ingot', param, callback);
}

/**
 * 房卡转钻石
 */
exports.try_ingot_to_gold = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.ingot);
    param.push(data.rate);
    call_proc(DB_AREA.GAME_DB, 'try_ingot_to_gold', param, callback);
}

/**
 * 
 */
exports.try_to_give_ingot = function (data, callback) {
    var param = [];
    param.push(data.account);
    param.push(data.target);
    param.push(data.ingot);
    call_proc(DB_AREA.GAME_DB, 'try_to_give_ingot', param, callback);
}

/**
 * 
 */
exports.try_to_give_gold = function(data,callback){
    var param =[];
    param.push(data.account);
    param.push(data.target);
    param.push(data.gold);
    call_proc(DB_AREA.GAME_DB, 'try_to_give_gold',param,callback);
}

/**
 * 
 */
exports.daily_share = function (data, callback) {
    var param = [];
    param.push(data.account);
    call_proc(DB_AREA.GAME_DB, 'daily_share', param, callback);
}

/**
 * 
 */
exports.lock_user = function (data, callback) {
    var param = [];
    param.push(data.user_id);
    param.push(data.lock_status);
    call_proc(DB_AREA.GAME_DB, 'web_lock_user', param, callback);
}

/**
 * 
 */
exports.agent_status = function (data, callback) {
    var param = [];
    param.push(data.user_id);
    param.push(data.agent_status);
    call_proc(DB_AREA.GAME_DB, 'web_agent_status', param, callback);
}
// //新增全局奖励
// exports.add_global_award = function(data,callback){
//     var param =[];
//     param.push(data.tittle)
//     param.push(data.content)
//     param.push(data.ingot)
//     param.push(data.gold)
//     param.push(data.attach)
//     param.push(data.condition_type)
//     param.push(data.condition_desc)
//     param.push(data.level_min)
//     param.push(data.level_max)
//     param.push(data.award_begin)
//     param.push(data.award_end)
//     param.push(data.registed_door)
//     param.push(data.add_agent)
//     call_proc('add_global_award',callback)
// }
// //更新全局奖励
// exports.update_global_award = function(data,callback){
//     var param =[];
//     param.push(data.award_id)
//     param.push(data.tittle)
//     param.push(data.content)
//     param.push(data.ingot)
//     param.push(data.gold)
//     param.push(data.attach)
//     param.push(data.condition_type)
//     param.push(data.condition_desc)
//     param.push(data.level_min)
//     param.push(data.level_max)
//     param.push(data.award_begin)
//     param.push(data.award_end)
//     param.push(data.registed_door)
//     param.push(data.status)
//     call_proc('update_global_award',callback)
// }


/**
 * 绑定靓号
 */
exports.distribution_beautifullid = function (bind_beautifull_id,user_id,callback) {
    var param = []
    param.push(bind_beautifull_id);
    param.push(user_id);
    call_proc(DB_AREA.GAME_DB, 'add_bind_beautifull_id', param, callback);
}

/**
 * 查询活动
 */
exports.query_activitys = function(callback) {
    var sql = "select activity_type, server_type, begin_time, end_time from activitys where status = 1";
    query(DB_AREA.GAME_DB, sql, function(err,rows){
        if(err){
            logger.error("query activitys failed.",err.stack);
            callback(false);
            return;
        }
        callback(rows);
        return;
    });
}

/**
 * 初始化日常任务
 */
exports.init_daily_tasks = function(user_id, daily_task, daily_task_clear_time, callback) {
    var sql = "UPDATE user_extro_info SET daily_task = '{0}', daily_task_clear_time = {1} WHERE user_id = {2}";
    sql = sql.format(daily_task, daily_task_clear_time, user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows.affectedRows > 0);
    });
}

/**
 * 初始化周常任务
 */
exports.init_week_tasks = function(user_id, week_task, week_task_clear_time, callback) {
    var sql = "UPDATE user_extro_info SET week_task = '{0}', week_task_clear_time = {1} WHERE user_id = {2}";
    sql = sql.format(week_task, week_task_clear_time, user_id);
    query(DB_AREA.GAME_DB, sql, function (err, rows) {
        if (err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows.affectedRows > 0);
    });
}

/**
 * 查询日常、周常任务
 */
exports.get_daily_and_week_tasks = function(user_id, callback) {
    var sql = "SELECT daily_task, daily_task_clear_time, week_task, week_task_clear_time from user_extro_info WHERE user_id = {0}";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows) {
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows[0]);
    })
}

/**
 * 更新日常、周常进度
 */
exports.update_daily_and_week_task = function(user_id, daily_task, week_task, callback) {
    var sql = "UPDATE user_extro_info SET daily_task = '{0}', week_task = '{1}' WHERE user_id = {2}";
    sql = sql.format(daily_task, week_task, user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows) {
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows.affectedRows > 0);
    })
}

///////////////////////////////公会（俱乐部）/////////////////////////////////////////////
/**
 * 根据用户ID查询公会（俱乐部）列表
 * @param {*} user_id 
 */
exports.select_unions_by_user_id = function(user_id, callback) {
    var sql = "select u.id as union_id, u.name as union_name, u.creator as creator, us.headimg as headimg, auto_create, auto_high_defend, create_conf from union_member um, `union` u, users us where um.user_id={0} and um.union_id=u.id and us.userid=u.creator";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows){
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}

/**
 * 获得用户公会（俱乐部）列表的详细数量（房间数量、人员数量）
 * @param {*} user_id 
 */
exports.select_unions_nums = function(user_id, callback) {
    var param = []
    param.push(user_id);
    call_proc(DB_AREA.GAME_DB, 'get_unions_nums', param, callback);
}

/**
 * 根据公会（俱乐部）ID查询所有成员信息
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.select_members_by_union_id = function (union_id, callback) {
    var sql = "select u.userid as userid, u.`name` as username, u.headimg as headimg, u.sex as sex from union_member um, users u where um.user_id=u.userid and um.union_id={0}";
    sql = sql.format(union_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows){
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}

/**
 * 根据公会（俱乐部）ID和用户ID判断用户是否是公会成员
 * @param {*} union_id 
 * @param {*} user_id 
 * @param {*} callback 
 */
exports.check_user_is_union_member = function (union_id, user_id, callback) {
    var sql = "select union_id, user_id from union_member where union_id={0} and user_id={1}";
    sql = sql.format(union_id, user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows){
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        if(rows.length > 0) {
            callback(true);
        }else {
            callback(false);
        }
    });
}

/**
 * 根据公会（俱乐部）ID查询公会（俱乐部）信息
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.select_union_by_id = function (union_id, callback) {
    var sql = "select u.id as union_id, u.name as union_name, u.creator as creator, us.headimg as headimg, auto_create, auto_high_defend, create_conf from `union` u, users us where u.id={0} and us.userid=u.creator";
    sql = sql.format(union_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows){
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows[0]);
    });
}

/**
 * 根据公会（俱乐部）ID查询所有申请信息
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.select_applys_by_union_id = function (user_id, union_id, callback) {
    var sql = "select u.userid as userid, u.`name` as username, u.headimg as headimg from union_apply ua, users u, `union` un where un.id = ua.union_id and un.creator={0} and ua.user_id=u.userid and ua.union_id={1} and ua.shield_time=0";
    sql = sql.format(user_id, union_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows){
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}

/**
 * 创建公会（俱乐部）
 * @param {*} user_id 
 * @param {*} union_name 
 * @param {*} max_nums 
 * @param {*} callback 
 */
exports.create_union = function(user_id, union_name, max_nums, callback) {
    var param = []
    param.push(user_id);
    param.push(union_name);
    param.push(max_nums);
    call_proc(DB_AREA.GAME_DB, 'create_union', param, callback);
}

/**
 * 修改公会（俱乐部）名称
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} new_union_name 
 * @param {*} callback 
 */
exports.change_union_name = function(user_id, union_id, new_union_name, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    param.push(new_union_name);
    call_proc(DB_AREA.GAME_DB, 'change_union_name', param, callback);
}

/**
 * 申请加入公会（俱乐部）
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.join_union = function(user_id, union_id, max_nums, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    param.push(max_nums);
    call_proc(DB_AREA.GAME_DB, 'join_union', param, callback);
}

/**
 * 同意加入公会（俱乐部）
 * @param {*} user_id 
 * @param {*} apply_user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.agree_join_union = function(user_id, apply_user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(apply_user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'agree_join_union', param, callback);
}

/**
 * 拒绝加入公会（俱乐部）
 * @param {*} user_id 
 * @param {*} apply_user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.refuse_join_union = function(user_id, apply_user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(apply_user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'refuse_join_union', param, callback);
}

/**
 * 屏蔽加入公会（俱乐部）
 * @param {*} user_id 
 * @param {*} apply_user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.shield_join_union = function(user_id, apply_user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(apply_user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'shield_join_union', param, callback);
}

/**
 * 离开公会（俱乐部）
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.leave_union = function(user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'leave_union', param, callback);
}

/**
 * 解散公会（俱乐部）
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.dissolve_union = function(user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'dissolve_union', param, callback);
}

/**
 * 删除公会（俱乐部）成员
 * @param {*} user_id 
 * @param {*} delete_user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.delete_member = function(user_id, delete_user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(delete_user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'delete_member', param, callback);
}

/**
 * 检查用户是否为公会成员，如果是则返回用户信息.
 * @param {*} account 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.check_union_member = function(account, union_id, callback) {
    var param = []
    param.push(account);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'check_union_member', param, callback);
}

/**
 * 根据ID查询公会房间列表
 * @param {*} unionid 
 * @param {*} callback 
 */
exports.select_union_rooms = function (unionid, callback) {
    var sql = "select id, base_info, seat_info, watch_seat, num_of_turns, create_time from rooms where JSON_EXTRACT(base_info,'$.unionid')={0}";
    sql = sql.format(unionid);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("SELECT UNION ROOM ERROR.", err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}

/**
 * 邀请加入公会（俱乐部）
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} invited_user_id
 * @param {*} callback 
 */
exports.invite_union = function(user_id, union_id, invited_user_id, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    param.push(invited_user_id);
    call_proc(DB_AREA.GAME_DB, 'invite_union', param, callback);
}

/**
 * 同意加入公会（俱乐部）邀请
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.agree_invite = function(user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'agree_invite', param, callback);
}

/**
 * 拒绝加入公会（俱乐部）邀请
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.refuse_invite = function(user_id, union_id, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    call_proc(DB_AREA.GAME_DB, 'refuse_invite', param, callback);
}

/**
 * 根据公会（俱乐部）ID查询所有申请信息
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.select_invites_by_user_id = function (user_id, callback) {
    var sql = "select u.userid as userid, u.`name` as username, u.headimg as headimg, un.id as unionid, un.name as unionname, ui.invite_time as invitetime from union_invite ui, users u, `union` un where un.creator=u.userid and un.id=ui.union_id and ui.user_id={0}";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows){
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}

/**
 * 设置公会（俱乐部）自动创建房间
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} callback 
 */
exports.set_union_auto_create = function(user_id, union_id, auto_create, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    param.push(auto_create);
    call_proc(DB_AREA.GAME_DB, 'set_union_auto_create', param, callback);
}

/**
 * 设置公会（俱乐部）自动创建房间规则
 * @param {*} user_id 
 * @param {*} union_id 
 * @param {*} iauto_high_defend 
 * @param {*} create_conf 
 * @param {*} callback 
 */
exports.set_union_create_conf = function(user_id, union_id, auto_high_defend, create_conf, callback) {
    var param = []
    param.push(user_id);
    param.push(union_id);
    param.push(auto_high_defend);
    param.push(create_conf);
    call_proc(DB_AREA.GAME_DB, 'set_union_create_conf', param, callback);
}
///////////////////////////////公会（俱乐部）/////////////////////////////////////////////

///////////////////////////////公会（俱乐部）聊天/////////////////////////////////////////////
//查询玩家公会信息
exports.select_unions_for_chat = function (userid, callback) {
    var sql = "select union_id, join_time from union_member where user_id = ?";
    sql = mysql.format(sql,userid)
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("SELECT UNIONS FOR CHAT.", err.stack);
            callback(false);
            return;
        }
        callback(rows);
    });
}

//插入公会聊天信息
exports.insert_union_chat = function (union_id, user_id, user_name, headimg, msg_id, chat_type, msg, voice_time, create_time, callback) {
    var param = []
    param.push(union_id);
    param.push(user_id);
    param.push(crypto.toBase64(user_name));
    param.push(headimg);
    param.push(msg_id);
    param.push(chat_type);
    param.push(msg);
    param.push(voice_time);
    param.push(create_time);
    call_proc(DB_AREA.GAME_DB, 'insert_union_chat', param, callback);
}

//根据公会ID查询公会聊天信息.
exports.select_union_msg = function (union_id, callback) {
    var sql = "select * from union_chat where union_id=?";
    sql = mysql.format(sql, union_id)
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("SELECT UNIONS MSG.", err.stack);
            callback(false, union_id);
            return;
        }
        callback(rows, union_id);
    });
}
///////////////////////////////公会（俱乐部）聊天/////////////////////////////////////////////

///////////////////////////////语音聊天/////////////////////////////////////////////
//插入语音聊天
exports.insert_voice = function(voice_id, voice_msg, create_time, callback) {
    var param = []
    param.push(voice_id);
    param.push(voice_msg);
    param.push(create_time);
    call_proc(DB_AREA.GAME_DB, 'insert_voice', param, callback);
}

//获得语音聊天
exports.get_voice = function(voice_id, callback) {
    var sql = "select * from voice_msg where voice_id = ?";
    sql = mysql.format(sql, voice_id);
    query(DB_AREA.GAME_DB,sql, function (err, rows) {
        if (err) {
            logger.error("SELECT VOICE.", err.stack);
            callback(false);
            return;
        }
        callback(rows[0]);
    });
}
///////////////////////////////语音聊天/////////////////////////////////////////////

/**
 * 获得比赛信息
 */
exports.get_match_info = function (user_id, callback) {
    var sql = "select match_info from user_extro_info where user_id = {0}";
    sql = sql.format(user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows) {
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        if(rows.length) {
            callback(rows[0]);
        } else {
            callback(false);
        }
    });
}

/**
 * 更新比赛信息
 */
exports.update_match_info = function (user_id, match_info, callback) {
    var sql = "update user_extro_info set match_info = '{0}' where user_id = {1}";
    sql = sql.format(match_info, user_id);
    query(DB_AREA.GAME_DB, sql, function(err, rows) {
        if(err) {
            logger.error(err.stack);
            callback(false);
            return;
        }
        callback(rows.affectedRows > 0);
    });
}

exports.register_self = function(config){
    var params =[]
    params.push(config.SERVER_GROUP);
    params.push(config.SERVER_TYPE);
    params.push(config.NAME);
    call_proc(DB_AREA.GAME_DB,'register_self',params);
}

//加载一日的订单
exports.load_wechat_day_order = function(day_time,callback){
    var params =[];
    params.push(day_time);
    call_proc(DB_AREA.GAME_DB,'load_wechat_day_order',params,callback);
}

//加载玩家统计等级相关的信息
exports.load_user_level_info = function(account,callback){
    var sql = "select userid,`lv`,`exp`,statistic from users ,user_extro_info where account = '{0}' and userid = user_id;"
    sql = sql.format(account);
    query(DB_AREA.GAME_DB,sql,(err,rows)=>{
        if(err){
            logger.error("load_user_level_info error:",err.stack);
            callback(null);
            return
        }
        callback(rows);
    })
}

/**
 * 更新玩家等级相关信息
 * @param {*} user_id 
 * @param {*} statistic 
 * @param {*} gold 
 * @param {*} ingot 
 * @param {*} callback 
 */
exports.update_user_level_info = function(user_id,statistic,gold,ingot,callback){
    var param =[];
    param.push(user_id);
    param.push(JSON.stringify(statistic));
    gold = Number(gold)?Number(gold):0;
    param.push(gold);
    ingot = Number(ingot)?Number(ingot):0;
    param.push(ingot);
    call_proc(DB_AREA.GAME_DB,"update_user_level_info",param,callback);
}
////////////////////////////////////////////游戏库结束///////////////////////////////////////////////

////////////////////////////////////////////日志库区域///////////////////////////////////////////////
/**
 * 插入房卡日志
 * @param {*} user_id 
 * @param {*} from 
 * @param {*} to 
 * @param {*} event_type 
 * @param {*} value 
 * @param {*} then_value 
 * @param {*} gtype 
 * @param {*} platform 
 * @param {*} channel 
 * @param {*} agent_id 
 * @param {*} server_type 
 * @param {*} callback 
 */
exports.insert_ingot_log = function(user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type,callback){
    logger.debug("insert ingot log")
    var param =[];
    param.push(user_id);
    param.push(from);
    param.push(to);
    param.push(event_type);
    param.push(value);
    param.push(then_value);
    param.push(gtype);
    param.push(platform);
    param.push(channel);
    param.push(agent_id);
    param.push(server_type);
    call_proc(DB_AREA.LOG_DB,'insert_ingot_log',param,callback);
}

/**
 * 插入钻石日志
 * @param {*} user_id 
 * @param {*} from 
 * @param {*} to 
 * @param {*} event_type 
 * @param {*} value 
 * @param {*} then_value 
 * @param {*} gtype 
 * @param {*} platform 
 * @param {*} channel 
 * @param {*} agent_id 
 * @param {*} server_type 
 * @param {*} callback 
 */
exports.insert_gold_log = function(user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type,callback){
    logger.debug("insert gold log")
    var param =[];
    param.push(user_id);
    param.push(from);
    param.push(to);
    param.push(event_type);
    param.push(value);
    param.push(then_value);
    param.push(gtype);
    param.push(platform);
    param.push(channel);
    param.push(agent_id);
    param.push(server_type);
    call_proc(DB_AREA.LOG_DB,'insert_gold_log',param,callback);
}

/**
 * 插入转盘日志
 * @param {*} ret 
 */
exports.insert_route_log = function(ret){
    var sql = 'insert into route_log (route_user_id,route_time,hit_index,hit_value,route_value,gift_mask,award_state,platform,channel) values({0},{1},{2},{3},{4},"{5}",{6},"{7}","{8}")';
    var award_state =0;
    if(ret.send){
        award_state = 1;
    }
    sql = sql.format(ret.user_id,ret.action_time,ret.hit_index,ret.random_ood,0,ret.mask,award_state,ret.platform,ret.channel);
    query(DB_AREA.LOG_DB,sql,function(err,rows){
        if(err){
            logger.error("INSERT GOLD LOG:",err.stack);
        }
    });
}
/**
 * 登录日志
 * @param {*} user_id 
 * @param {*} platform 
 * @param {*} channel 
 * @param {*} reg_time 
 * @param {*} ip_info 
 * @param {*} agent_id 
 */
exports.login_log = function(user_id,platform,channel,reg_time,ip_info,agent_id){
    var sql = 'insert into login_log(user_id,platform,channel,reg_time,login_time,last_insert_time,country,area,city,agent_id) values({0},"{1}","{2}",{3},unix_timestamp(now()),unix_timestamp(now()),"{4}","{5}","{6}",{7})';
    sql = sql.format(user_id,platform,channel,reg_time,ip_info.country,ip_info.area,ip_info.city,agent_id);
    query(DB_AREA.LOG_DB,sql,function(err,rows){
        if(err){
            logger.error("INSERT LOGIN LOG:",err.stack);
        }
    });
}

/**
 * 注册日志
 * @param {*} user_id 
 * @param {*} platform 
 * @param {*} channel 
 * @param {*} reg_time 
 * @param {*} ip_info 
 */
exports.reg_log = function(user_id,platform,channel,reg_time,ip_info){
    var sql = 'insert into reg_log(user_id,platform,channel,reg_time,login_time,last_insert_time,country,area,city) values({0},"{1}","{2}",{3},unix_timestamp(now()),unix_timestamp(now()),"{4}","{5}","{6}")';
    sql = sql.format(user_id,platform,channel,reg_time,ip_info.country,ip_info.area,ip_info.city);
    query(DB_AREA.LOG_DB,sql,function(err,rows){
        if(err){
            logger.error("INSERT REG LOG:",err.stack);
        }
    });
}

/**
 * 插入开房日志
 * @param {*} user_id 
 * @param {*} game_type 
 * @param {*} type_index 
 * @param {*} rule_index
 * @param {*} room_id 
 * @param {*} platform 
 * @param {*} channel 
 * @param {*} ip_info 
 * @param {*} agent_id 
 */
exports.insert_create_room_log = function(user_id,game_type,type_index,rule_index,room_id,platform,channel,ip_info,agent_id){
    if(!agent_id){
        agent_id =0;
    }
    var sql = 'insert into create_room_log(user_id,game_type,type_index,rule_index,create_time,roomid,last_insert_time,platform,channel,country,area,city,agent_id) values({0},{1},{2},{3},unix_timestamp(now()),"{4}",unix_timestamp(now()),"{5}","{6}","{7}","{8}","{9}",{10})';
    sql = sql.format(user_id,game_type,type_index,rule_index,room_id,platform,channel,ip_info.country,ip_info.area,ip_info.city,agent_id);
    query(DB_AREA.LOG_DB,sql,function(err,rows){
        if(err){
            logger.error("INSERT CREATE ROOM LOG:",err.stack);
        }
    });
}

/**
 * 转盘记录
 * @param {*} user_id 
 * @param {*} callback 
 */
exports.get_route_log = function(user_id,callback){
    // var sql = 'select route_time,hit_index,gift_mask,award_state from route_log where route_user_id ={0} ORDER BY award_state asc,route_time desc LIMIT 10;'
    var sql = 'select route_time,hit_index,gift_mask,award_state from route_log where route_user_id ={0} ORDER BY route_time desc LIMIT 10'
    sql = sql.format(user_id);
    query(DB_AREA.LOG_DB,sql,function(err,rows){
        if(err){
            logger.error("GET ROUTE LOG ERROR:",err.stack);
            callback(false);
            return;
        }
        callback(rows);
    })
}
/**
 * 获取用户货币日志
 * @param {*} user_id 
 * @param {*} callback 
 */
exports.load_user_money_logs = function(user_id,m_type,page,callback){
    var sql = "select id,event_type,`from`,`to`,change_value,last_insert_time from {0} \
    where user_id ={1} and event_type in ({2},{3}) order by id desc LIMIT {4},{5};"
    if(m_type == 0){
        //钻石信息
        sql = sql.format("gold_log",user_id,302,403,30*(page-1),30*page);
    }else{
        //房卡信息
        sql = sql.format("ingot_log",user_id,102,203,30*(page-1),30*page);
    }
    query(DB_AREA.LOG_DB,sql,(err,rows)=>{
        if(err){
            logger.err("LOAD USER MONEY LOGS error:",err.stack);
            callback([]);
            return;
        }
        callback(rows);
    })
}
////////////////////////////////////////////日志库结束///////////////////////////////////////////////

////////////////////////////////////////////代理库区域///////////////////////////////////////////////
/**
 * 获得代理URL地址
 */
exports.get_agent_url = function(agent_id,callback){
    var sql = "select promotion_qrcodes, promotion_qrcodes_h from wechat_user where id = {0}";
    sql = sql.format(agent_id);
    query(DB_AREA.AGENT_DB, sql, function(err,rows){
        if(err){
            logger.error("SQL.....",sql);
            logger.error("GET AGENT URL ERROR:",err);
            callback(false,null);
            return;
        }
        if(rows.length){
            callback(true,rows[0]);
            return;
        }
        callback(true,null);
        return;
    });
}

exports.get_agent_byid = function(agent_id,callback){
    var sql = "select id,binded from wechat_user where id = {0}"
    sql = sql.format(agent_id);
    query(DB_AREA.AGENT_DB,sql,(err,rows) =>{
        if(err){
            logger.error("AGENT DB get agent by id failed.",err)
            callback(false);
            return;
        }
        if(rows.length){
            callback(true,rows[0]);
            return;
        }
        callback(false);
    })
}

exports.get_agent_info = function(agent_id,callback){
    var sql = "select tel,weixin,qq from wechat_user where id ={0}";
    sql = sql.format(agent_id)
    query(DB_AREA.AGENT_DB,sql,(err,rows) =>{
        if(err){
            logger.error("AGENT DB get agent_info failed:",err);
            callback(false);
            return;
        }
        if(rows.length){
            callback(true,rows[0]);
            return;
        }
        callback(false);
    })
}
////////////////////////////////////////////代理库结束///////////////////////////////////////////////

////////////////////////////////////////////账号库区域///////////////////////////////////////////////
/**
 * 尝试注册或者更新账户
 */
exports.account_try_create_or_update_user = function (data, callback) {
    var param = []
    param.push(data.account);
    param.push(data.name);
    param.push(data.sex);
    param.push(data.headimgurl);
    param.push(data.platform);
    param.push(data.channal);
    param.push(data.now);
    param.push(data.wx_openid);
    param.push(data.web_call);
    param.push(data.agent_id)
    param.push(data.ingot);
    param.push(data.gold);
    call_proc(DB_AREA.ACCOUNT_DB, 'create_or_update_user', param, callback);
}
/**
 * 尝试注册或者更新账户(游客)
 */
exports.try_create_or_update_guest = function (data, callback) {
    var param = []
    param.push(data.account);
    param.push(data.name);
    param.push(data.sex);
    param.push(data.headimgurl);
    param.push(data.platform);
    param.push(data.channal);
    param.push(data.now);
    param.push(data.wx_openid);
    param.push(data.web_call);
    param.push(data.agent_id)
    param.push(data.ingot);
    param.push(data.gold);
    call_proc(DB_AREA.ACCOUNT_DB, 'create_or_update_guest', param, callback);
}
////////////////////////////////////////////账号服结束///////////////////////////////////////////////

///////////////////////////////////////////比赛服区域////////////////////////////////////////////////

/////////////////////////玩家数据/////////////////////////////////////////////

//加载玩家比赛信息
exports.load_user_match_info = function(user_id,callback){
    var sql = "select match_user.match_uuid as uuid,`keys` as token,server_type,match_type from match_user,match_info where match_user.match_uuid = match_info.match_uuid and user_id = {0} and match_user.status >0";
    sql = sql.format(user_id);
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("load user match info error:",err);
            callback(null);
            return;
        }
        if(rows.length){
            callback(rows);
            return;
        }
        callback(null);
    })
}

exports.get_user_match_history = function(user_id,callback){
    var sql = "select score,top_index,awards,send_status,begin_time,archive_time from match_top,match_info_archive \
    where match_info_archive.match_uuid = match_info_archive.match_uuid and  user_id = {0} ORDER BY begin_time;"
    sql = sql.format(user_id);
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("get user match history error:",err);
            callback(null);
        }
        if(rows.length){
            callback(rows);
            return;
        }
        callback(null);
    });
}

//加载比赛玩家数据
exports.load_match_user = function(callback){
    var sql = "select user_id,`keys`,score,top,`name`,headimg,sex,table_id,platform,channel,agent_id,web_agent,reg_time,create_time from match_user";
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("LOAD MATCH USER FAILED:",err);
            callback(null);
            return;
        }
        callback(rows);
    })
}

/**
 * 根据token加载玩家数据
 */
exports.load_match_user_by_token = function(token, callback){
    var sql = "select user_id, score, `name`, headimg, sex from match_user where `keys` = '{0}'";
    sql = sql.format(token);
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("LOAD MATCH USER BY TOKEN FAILED:",err);
            callback(null);
            return;
        }
        if(rows.length){
            callback(rows[0]);
        } else {
            callback(false);
        }
    })
}

/**
 * 查找用户信息
 */
exports.find_user_info = function(user_id,callback){
    var sql = "select user_id,`status` from match_user where user_id = {0}"
    sql = sql.format(user_id);
    query(DB_AREA.MATCH_DB,sql, (err,rows,fields) =>{
        if(err){
            logger.error("Find user info failed:",err)
            callback(false);
            return
        }
        if(rows.length) {
            callback(rows[0]);
        } else {
            callback(false);
        }
    });
}

//添加比赛玩家数据
exports.add_match_user = function(user_info,callback){
    var sql = "insert into match_user (user_id,match_uuid,`keys`,score,top,`name`,headimg,`sex`,table_id,platform,channel,agent_id,web_agent,reg_time,status,create_time) values(\
                                        {0},'{1}','{2}',{3}, 0,'{4}','{5}',{6}, 0,'{7}','{8}',{9},{10},{11},1,unix_timestamp(now()))";
    sql = sql.format(user_info.user_id,user_info.match_uuid,user_info.keys, user_info.score, user_info.name, user_info.headimg, user_info.sex, user_info.platform, user_info.channel, user_info.agent_id, user_info.web_agent, user_info.reg_time);
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("add match user failed:", err);
            callback(false);
            return
        }
        callback(true);
    });
}

/**
 * 更新比赛用户状态
 */
exports.update_match_user = function(user_id,status,callback){
    var sql = "update match_user set status = {0} where user_id = {1}";
    sql = sql.format(status, user_id);
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("update match user status failed:", err);
            callback(false);
            return
        }
        if(rows.affectedRows != 1){
            logger.error("update match user status failed: no user!!! ", err);
            callback(false);
            return;
        }
        callback(true);
    })
}

//同步玩家得分
exports.sync_user_score = function(user_id,score){
    var sql = '';
    if(score >0){
        sql = "update match_user set score = score + {0} where user_id ={1}"
    }else{
        sql = "update match_user set score = score - {0} where user_id ={1}"        
    }
    if(sql != ''){
        sql = sql.format(Math.abs(score),user_id);
    }
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("sync user score failed:",err);
        }
    })
}

//////////////////////////////////比赛基础信息/////////////////////////////

//加载比赛信息
exports.load_match_info = function(server_type,callback){
    var sql = 'select * from match_info where server_type = {0}';
    sql = sql.format(server_type)
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("load match info failed:",err);
            callback(null);
            return;
        }
        if(rows.length){
            callback(rows[0]);
            return;
        }
        callback(null);
        return;
    })
}

exports.load_macth_award_config = function(callback){
    var sql = 'select * from award_config';
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("load award config failed:",err);
            callback(null);
        }
        if(rows.length){
            callback(rows);
            return
        }
        callback(null);
        return;
    })
}

//插入比赛信息
exports.dump_match_info = function(match_info){
    logger.debug("new match info created..............")
    var sql = "INSERT INTO match_info (match_uuid,server_type,match_type,detail,begin_time)\
        values('{0}',{1},{2},'{3}',unix_timestamp(now()))";
    sql = sql.format(match_info.guid,match_info.server_type,match_info.match_type,JSON.stringify(match_info));
    query(DB_AREA.MATCH_DB,sql,(err,rows)=>{
        if(err){
            logger.error("Dump match info failed:",err);
        }
    })
}

//////////////////////////桌子逻辑////////////////////////////////

//更新比赛信息
exports.sync_match_info  = function(match_info){
    logger.debug("SYNC match info %s",JSON.stringify(match_info));
    //确定只更新变动信息,目前仅仅更新比赛状态
    var sql = "update match_info set detail = '{0}' where match_uuid = '{1}'";
    sql = sql.format(JSON.stringify(match_info),match_info.guid)
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("sync match info failed:",err);
        }
    });
}

//存入新的桌子信息
exports.new_match_table_info = function(table_id,guid,cur_loop,table_info){
    logger.debug("new match table info .........")
    var sql = "INSERT INTO match_table(table_id,match_uuid,loops,table_info,create_time) VALUES\
        ({0},'{1}',{2},'{3}',unix_timestamp(now()))";
    sql = sql.format(table_id,guid,cur_loop,JSON.stringify(table_info));
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("new match table info ERROR:",err);
        }
    });
}
//存入桌子信息
exports.sync_match_table_info = function(){
    logger.debug("sync match table info .....")
    var sql = '';
    query(DB_AREA.MATCH_DB,sql,(err,rows) =>{
        if(err){
            logger.error("sync match table info ERROR:",err);
        }
    });
}

//新的排名信息
exports.new_match_top_info = function(match_uuid,top_info){
    logger.debug("new match top info....")
    var sql ="REPLACE INTO match_top (match_uuid,user_id,`name`,head,sex,score,top_index,awards,send_status) \
            values('{0}',{1},'{2}','{3}',{4},{5},{6},'{7}',{8})";
    sql = sql.format(match_uuid,top_info.user_id,top_info.name,top_info.headimg,top_info.sex,top_info.score,top_info.top_index,JSON.stringify(top_info.award),top_info.send);
    query(DB_AREA.MATCH_DB,sql,(err,rows)=>{
        if(err){
            logger.error("new match top info failed.",err)
        }
    })
}

/////////////////////////////压缩逻辑////////////////////////////////
//压缩玩家信息
exports.archive_match_user_info = function(match_uuid,callback){
    logger.debug("All game over archive user info ....",match_uuid);
    var param =[];
    param.push(match_uuid);
    call_proc(DB_AREA.MATCH_DB,'archive_match_user_info',param,callback)
}

//压缩比赛信息
exports.archive_match_info = function(match_uuid,callback){
    logger.debug("All game over archive match info .....",match_uuid);
    var param =[];
    param.push(match_uuid);
    call_proc(DB_AREA.MATCH_DB,'archive_match_info',param,callback);
}

//压缩桌子信息
exports.archive_match_table_info = function(match_uuid,callback){
    logger.debug("All game over archive table info ....",match_uuid);
    var param =[];
    param.push(match_uuid);
    call_proc(DB_AREA.MATCH_DB,'archive_match_table_info',param);
}

//压缩排名信息
exports.archive_match_top_info = function(match_uuid,callback){
    logger.debug()
    var param =[];
    param.push(match_uuid);
    call_proc(DB_AREA.MATCH_DB,'archive_match_top_info',param);
}
////////////////////////////////////////////////////比赛服结束//////////////////////////////////////////////////

/////////////////////////////////////////线上数据修复///////////////////////////////////////////////////////////
exports.fix_load_wechat_pay_order = function(sql,callback){
    query(DB_AREA.GAME_DB,sql,(err,rows)=>{
        if(err){
            logger.error("fix_load_wechat_pay_order error:",err)
            callback(false);
        }else{
            callback(rows);
        }
    })
}

exports.fix_update_wehcat_pay_order = function(sql,pid,callback){
    query(DB_AREA.GAME_DB,sql,(err,rows)=>{
        if(err){
            logger.error("fix_update_wehcat_pay_order error:",err);
            callback(false,pid);
        }else{
            callback(true,pid);
        }
    })
}
/////////////////////////////////////////线上数据修复///////////////////////////////////////////////////////////