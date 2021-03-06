const path = require("path");
const log4js = require('../utils/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////
const crypto = require("../crypto");
const db_mysql = require('../utils/db_mysql');
const db_redis = require('../utils/db_redis');


/**
 * 验证用户是否存在
 * @param {*} account 
 */
exports.get_user_id_exist_async = async function (account = "") {
    const sql = `SELECT userid FROM users WHERE account = '${account}' and 'lock' = 0`;
    const user = await db_mysql.query_async(db_mysql.DB_AREA.GAME_DB, sql);
    return user.length > 0 ? user[0].userid : null;
}

/**
 * 同步-->根据用户account获取用户信息
 * @param {*} account 
 * @returns {user_info} 用户信息
 */
exports.get_user_info_async = async function (account = "") {
    const redis_key = db_redis.FIELD.ACCOUNT + account;
    const redis_value = await db_redis.get_value_async(redis_key);
    if (redis_value) {
        return JSON.parse(redis_value);
    } else {
        const sql = `select * from users,user_extro_info where users.userid = user_extro_info.user_id  and users.account =  '${account}'  limit 1`;
        const user_infos = await db_mysql.query_async(db_mysql.DB_AREA.GAME_DB, sql);
        if (user_infos.length == 1) {
            await db_redis.set_value_async(redis_key, user_infos[0]);
        }
        return user_infos[0];
    }
}

exports.get_user_info_by_id_async = async function (user_id = 0) {
    const redis_key = db_redis.FIELD.USER_ID + user_id;
    const redis_value = await db_redis.get_value_async(redis_key);
    if (redis_value) {
        return JSON.parse(redis_value);
    } else {
        const sql = `select * from users,user_extro_info where users.userid = user_extro_info.user_id  and users.userid =  ${user_id}  limit 1`;
        const user_infos = await db_mysql.query_async(db_mysql.DB_AREA.GAME_DB, sql);
        if (user_infos.length == 1) {
            user_infos[0].name = crypto.fromBase64(user_infos[0].name);
        }
        await db_redis.set_value_async(redis_key, user_infos[0]);
        return user_infos[0];
    }
}

exports.update_user_login_time_async = async function (account = "") {
    const sql = `UPDATE users SET login_time = unix_timestamp(now())  WHERE account = '${account}' `;
    return await db_mysql.query_async(db_mysql.DB_AREA.GAME_DB, sql);
}

exports.get_user_account_async = async function (token = "") {
    return await db_redis.get_value_async(db_redis.FIELD.TOKEN + token);
}