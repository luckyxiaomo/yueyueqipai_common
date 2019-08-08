const path = require("path");
const log4js = require('../logs/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////
const RedisPool = require("sol-redis-pool")
let redis_pool = null;
const FIELD = {
    TOKEN: "token:"
}

exports.FIELD = FIELD;

exports.init = function () {
    redis_pool = RedisPool(process.ENV_CONFIG.REDIS_SETTING, process.ENV_CONFIG.REDIS_POOL_SETTING);
}


/**
 * 同步获取redis中的值
 * @param {*} key 
 * @param {*} default_value 
 */
exports.get_value_async = function (key, default_value) {
    return new Promise((resolve, reject) => {
        redis_pool.acquire((err, client) => {
            if (err) {
                logger.error("REDIS ASYNC GET CONNECTION FAILED:", err);
                reject(default_value);
                return;
            }
            client.get(key, (gerr, rsp) => {
                redis_pool.release(client);
                if (gerr) {
                    logger.err("REDIS ASYNC GET KEY ERROR:", gerr);
                    reject(default_value);
                    return;
                }
                resolve(rsp);
            })
        })
    })
}

/**
 * 获取redis中的值
 * @param {*} key 
 * @param {*} default_value
 * @param {*} call_back
 */
exports.get_value = function (key, default_value, call_back) {
    redis_pool.acquire((err, client) => {
        if (err) {
            logger.error("REDIS GET CONNECTION FAILED:", err);
            call_back(err, default_value);
            return;
        }
        client.get(key, (gerr, rsp) => {
            redis_pool.release(client);
            if (gerr) {
                logger.error("REDIS GET KEY ERROR:", gerr)
                call_back(gerr, default_value);
                return
            }
            call_back(null, rsp);
            return
        })
    })
}

/**
 * 同步设置值
 * @param {*} key
 * @param {*} value 
 */
exports.set_value_async = function (key, value) {
    return new Promise((resolve, reject) => {
        redis_pool.acquire((err, client) => {
            if (err) {
                logger.error("REDIS SET GET CLIENT FAILED:", err);
                reject(null);
                return;
            }
            if (typeof value == 'object') {
                value = JSON.stringify(value);
            }
            client.set(key, value, (serr, rsp) => {
                redis_pool.release(client);
                if (serr) {
                    logger.error("REDIS SET VALUE FAILED:", serr);
                    reject(null);
                    return;
                }
                resolve(rsp);
            })
        })
    })
}

/**
 * 异步设置值
 * @param {*} key
 * @param {*} value 
 * @param {*} call_back 
 */
exports.set_value = function (key, value, call_back) {
    redis_pool.acquire((err, client) => {
        if (err) {
            logger.error("REDIS SET GET CLIENT FAILED:", err);
            call_back(err, null);
            return;
        }
        if (typeof value == 'object') {
            value = JSON.stringify(value)
        }
        client.set(key, value, (serr, rsp) => {
            redis_pool.release(client);
            if (serr) {
                logger.error("REDIS SET VALUE FAILED:", serr);
                call_back(serr, null);
                return;
            }
            call_back(null, rsp);
        })
    })
}

/**
 * 同步设置记录生命周期
 * @param {*} key 
 * @param {*} time 
 */
exports.expire_async = function (key, time) {
    return new Promise((resolve, reject) => {
        redis_pool.acquire((err, client) => {
            if (err) {
                logger.error("REDIS SET GET CLIENT FAILED:", err);
                reject(null)
                return;
            }
            if (typeof value == 'object') {
                value = JSON.stringify(value)
            }
            client.expire(key, time, (serr, rsp) => {
                redis_pool.release(client);
                if (serr) {
                    logger.error("REDIS SET VALUE FAILED:", serr);
                    reject(null);
                    return;
                }
                resolve(rsp)
            })
        })
    });
}

/**
 * 设置记录生命周期
 * @param {*} key 
 * @param {*} time(秒) 
 * @param {*} call_back 
 */
exports.expire = function (key, time, call_back) {
    redis_pool.acquire((err, client) => {
        if (err) {
            logger.error("REDIS SET GET CLIENT FAILED:", err);
            call_back(err, null);
            return;
        }
        if (typeof value == 'object') {
            value = JSON.stringify(value)
        }
        client.expire(key, time, (serr, rsp) => {
            redis_pool.release(client);
            if (serr) {
                logger.error("REDIS SET VALUE FAILED:", serr);
                call_back(serr, null);
                return;
            }
            call_back(null, rsp);
        })
    })
}

/**
 * 同时设置时限记录
 * @param {*} key 
 * @param {*} value 
 * @param {*} time 
 */
exports.set_value_expire_async = function (key, value, time) {
    return new Promise((resolve, reject) => {
        redis_pool.acquire((err, client) => {
            if (err) {
                logger.error("REDIS SET GET CLIENT FAILED:", err);
                reject(null);
                return;
            }
            if (typeof value == 'object') {
                value = JSON.stringify(value)
            }
            client.set(key, value, (serr, rsp) => {
                if (serr) {
                    logger.error("REDIS SET VALUE FAILED:", serr);
                    reject(null);
                    redis_pool.release(client);
                    return;
                }
                client.expire(key, time, (eerr, rsp) => {
                    redis_pool.release(client);
                    if (eerr) {
                        logger.error("REDIS EXPIRE VALUE FAILED:", eerr);
                        reject(null);
                        return;
                    }
                    resolve(rsp);
                });
            });
        });
    });
}

/**
 * 设置时限的记录
 * @param {*} key 
 * @param {*} value 
 * @param {*} time 
 * @param {*} call_back 
 */
exports.set_value_expire = function (key, value, time, call_back) {
    redis_pool.acquire((err, client) => {
        if (err) {
            logger.error("REDIS SET GET CLIENT FAILED:", err);
            call_back(err, null);
            return;
        }
        if (typeof value == 'object') {
            value = JSON.stringify(value)
        }
        client.set(key, value, (serr, rsp) => {
            if (serr) {
                logger.error("REDIS SET VALUE FAILED:", serr);
                call_back(serr, null);
                redis_pool.release(client);
                return;
            }
            client.expire(key, time, (eerr, rsp) => {
                redis_pool.release(client);
                if (eerr) {
                    logger.error("REDIS EXPIRE VALUE FAILED:", eerr);
                    call_back(eerr, null);
                    return;
                }
                call_back(null, rsp);
            })
        })
    })
}

