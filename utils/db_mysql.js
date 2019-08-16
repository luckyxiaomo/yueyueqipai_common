const path = require("path");
const log4js = require('./log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////
/**
 * 数据库基本操作
 */
const mysql = require("mysql");
const pools = {};   // 连接池

//连接池索引
exports.DB_AREA = {
    GAME_DB: "game_db",
    MATCH_DB: "match_db",
}


const DB_TYPE = {
    DB_FORK: 'fork',
    DB_CLUSTER: 'cluster'
}

const CLUSTER_CONFIG = {
    removeNodeErrorCount: 9,
    defaultSelector: 'ORDER'
}


exports.add_to_pool = function (area, config) {
    logger.info("database config ==>", area, config);
    let pool = null;
    if (config.dbtype == DB_TYPE.DB_FORK) {
        pool = mysql.createPool(config.config);
    }
    if (config.dbtype == DB_TYPE.DB_CLUSTER) {
        pool = mysql.createPoolCluster(CLUSTER_CONFIG);
        for (let name in config.config) {
            pool.add(name, config.config[name]);
        }
        pools.push(pool);
    }
    pools[area] = pool;
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
exports.query_with_params = function (area, sql, params, callback) {
    logger.debug("SQL: ", sql);
    callback = callback ? callback : nop;
    pools[area].getConnection((err_conn, connection) => {
        if (err_conn) {
            callback(err_conn, null);
            return;
        } else {
            connection.query(sql, params, (err_query, rows) => {
                connection.release()
                callback(err_query, rows);
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
exports.query_async_params = function (area, sql, params) {
    logger.debug("SQL: ", sql);
    return new Promise((resolve, reject) => {
        pools[area].getConnection((err_conn, connection) => {
            if (err_conn) {
                logger.error("query_async_params get connection ERROR:", err_conn);
                resolve(false);
            } else {
                connection.query(sql, params, (err_query, rows) => {
                    connection.release();
                    if (err_query) {
                        logger.error("query_async_params query ERROR:", err_query);
                        resolve(false);
                    } else {
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
exports.query = function (area, sql, callback) {
    logger.debug("SQL: ", sql);
    callback = callback ? callback : nop;
    pools[area].getConnection((err_conn, connection) => {
        if (err_conn) {
            callback(err_conn, null);
            return;
        } else {
            connection.query(sql, (err_query, rows) => {
                connection.release()
                callback(err_query, rows);
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
exports.query_async = function (area, sql, callback) {
    logger.debug("SQL: ", sql);
    return new Promise((resolve, reject) => {
        pools[area].getConnection((err_conn, connection) => {
            if (err_conn) {
                logger.error("query_async get connection ERROR:", err_conn);
                resolve(false);
            } else {
                connection.query(sql, (err_query, rows) => {
                    connection.release();
                    if (err_query) {
                        logger.error("query_async query ERROR:", err_query);
                        resolve(false);
                    } else {
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
exports.call_proc = function (area, proc_name, params, callback) {
    callback = callback ? callback : nop;
    const sql = 'call ' + proc_name + '(';
    for (let a in params) {
        if (a == params.length - 1) {
            sql += '?';
        } else {
            sql += '?,';
        }
    }
    sql += ');';
    logger.debug("SQL: ", sql);
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
exports.call_proc_async = function (area, proc_name, params) {
    return new Promise((resolve, reject) => {
        pools[area].getConnection(function (err_conn, connection) {
            if (err_conn) {
                logger.error(err_conn);
                resolve(false);
            } else {
                const sql = 'call ' + proc_name + '(';
                for (let a in params) {
                    if (a == params.length - 1) {
                        sql += '?';
                    } else {
                        sql += '?,';
                    }
                }
                sql += ');';
                logger.debug("SQL: ", sql);
                connection.query(sql, params, (err, rows) => {
                    connection.release();
                    if (err) {
                        logger.error(err);
                        resolve(false);
                    } else {
                        resolve(rows);
                    }
                });
            }
        });
    });
}
///////////////////////////////////////////内部接口封装结束/////////////////////////////////////////////////