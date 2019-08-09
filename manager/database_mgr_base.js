const path = require("path");
const log4js = require('../logs/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////

const db_mysql = require('../utils/db_mysql');
const db_redis = require('../utils/db_redis');


/**
 * 验证用户是否存在
 * @param {*} account 
 */
exports.is_user_exist_sync = async function (account = "") {
    let sql = "SELECT userid FROM users WHERE account = '{0}' and `lock` = 0";
    sql = sql.format(account);
    return await db_mysql.query_sync(db_mysql.DB_AREA.GAME_DB, sql);
}

/**
 * 同步-->根据用户account获取用户信息
 * @param {*} account 
 * @returns {user_info} 用户信息
 */
exports.get_user_info_sync = async function (account = "") {
    const redis_key = db_redis.FIELD.ACCOUNT + account;
    const redis_value = await db_redis.get_value_async(redis_key);
    if (redis_value) {
        return JSON.parse(redis_value);
    } else {
        let sql = "select * from users,user_extro_info where users.userid = user_extro_info.user_id  and users.account = '{0}' limit 1";
        sql = sql.format(account);
        const user_infos = await db_mysql.query_sync(db_mysql.DB_AREA.GAME_DB, sql);
        if (user_infos.length == 1) {
            await db_redis.set_value_async(redis_key, user_infos[0]);
        }
        return user_infos[0];
    }
}

exports.update_user_login_time_sync = async function (account = "") {
    let sql = "UPDATE users SET login_time = unix_timestamp(now())  WHERE account = '{0}' ";
    sql = sql.format(account);
    return await db_mysql.query_sync(db_mysql.DB_AREA.GAME_DB, sql);
}

exports.get_user_account_sync = async function (token = "") {
    return await db_redis.get_value_async(db_redis.FIELD.TOKEN + token);
}