/**
 * 货币操作服务
 */
const http_client = require("../utils/http_client");
var log_manager = require('../log_manager')
var db = require('../database');
const logger = require("../log").logger;

//增加房卡
exports.add_ingot = function (user_id, ingot_value, log_point, gtype, server_type) {

}
//增加钻石
exports.add_gold = function (user_id, gold_value, log_point, gtype, server_type) {

}
//消耗房卡
exports.lose_ingot = function (user_id, ingot_value, log_point, gtype, server_type) {
    db.cost_ingot(user_id, ingot_value, function (err, rows) {
        if (err) {
            logger.error("LOSE INGOT FAILED: log_point = %d, err= %s", log_point, err);
            return;
        }
        if (rows[0][0].result != 1) {
            logger.warn('LOSE INGOT db log_point = %s,result = %d', log_point, rows[0][0].result);
        } else {
            log_manager.insert_ingot_log(user_id, user_id, 0, log_point, ingot_value, rows[0][0].now_ingot, gtype, rows[0][0].platform, rows[0][0].channel, rows[0][0].agent_id, server_type);
        }
    });
}
//消耗钻石
exports.lose_gold = function (user_id, gold_value, log_point, gtype, server_type) {
    db.cost_gold(user_id, gold_value, function (err, rows) {
        if (err) {
            logger.error("LOSE GOLD FAILED: log_point = %d, err= %s", log_point, err);
            return;
        }
        if (rows[0][0].result != 1) {
            logger.warn('LOSE GOLD db log_point = %s,result = %d', log_point, rows[0][0].result);
        } else {
            log_manager.insert_gold_log(user_id, user_id, 0, log_point.GOLD_COST_OPEN, gold_value, rows[0][0].now_gold, gtype, rows[0][0].platform, rows[0][0].channel, rows[0][0].agent_id, server_type);
        }
    });
}

// 核验玩家道具
exports.check_user_items_async = async function (user, items, condition = true) {
    const res = await http_client.http_post_async(
        process.ENV_CONFIG.BAG_SERVER_IP,
        process.ENV_CONFIG.BAG_SERVER_PORT,
        "/checkout",
        {
            user,
            items,
            condition
        }
    );
    if (!res || res.code != 0) {
        return false;
    }
    return res.data;
}

// 扣除玩家道具
exports.decrease_user_items_async = async function (user, items) {
    let res = await http_client.http_post_async(
        process.ENV_CONFIG.BAG_SERVER_IP,
        process.ENV_CONFIG.BAG_SERVER_PORT,
        "/decrease",
        {
            user,
            items,
            remark: `私人场扣费：${JSON.stringify(items)}`
        }
    );
    if (!res || res.code != 0) {
        logger.error("私人场扣费失败", res);
        return;
    }
}

// 补偿玩家道具
exports.increase_user_items_async = async function (user, items) {
    let res = await http_client.http_post_async(
        process.ENV_CONFIG.BAG_SERVER_IP,
        process.ENV_CONFIG.BAG_SERVER_PORT,
        "/increase",
        {
            user,
            items,
            remark: `私人场返还扣费：${JSON.stringify(items)}`
        }
    );
    if (!res || res.code != 0) {
        logger.error("私人场返还扣费失败", res);
        return;
    }
}