/**
 * 货币操作服务
 */
const http_client = require("../utils/http_client");
var log_manager = require('../log_manager')
var db = require('../database');
const logger = require("../log").logger;

//增加房卡
exports.add_ingot_async = async function (user_id, ingot_value, remark) {
    let res = await http_client.http_post_async(
        process.ENV_CONFIG.BAG_SERVER_IP,
        process.ENV_CONFIG.BAG_SERVER_PORT,
        "/increase",
        {
            user: user_id,
            items: [{ itemName: "房卡", count: ingot_value }],
            remark
        }
    );
    if (!res || res.code != 0) {
        logger.error(`添加房卡失败，Remark：${remark}`, res);
    }
}
//增加钻石
exports.add_gold_async = async function (user_id, gold_value, remark) {
    let res = await http_client.http_post_async(
        process.ENV_CONFIG.BAG_SERVER_IP,
        process.ENV_CONFIG.BAG_SERVER_PORT,
        "/increase",
        {
            user: user_id,
            items: [{ itemName: "钻石", count: gold_value }],
            remark
        }
    );
    if (!res || res.code != 0) {
        logger.error(`添加钻石失败，Remark：${remark}`, res);
    }
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

const play_users = [];

// 给参与者的邀请者发邮件奖励
exports.award_user_inviter = function (user_ids) {
    play_users.push(...user_ids);
}

async function deal_inviter_awards_async() {
    if (play_users.length > 0) {
        const params = {
            // user?: number;           // 玩家ID  如有，将直接发放奖励
            // awards: string[];        // 奖励名称，列表
            // condition: boolean;      // true：多个合并 false：优先取一个
            // remark?: string;         // 备注 （ex：比赛获得）
            awards: ["被邀请者：游戏"],
        }
        const result = await http_client.http_post_async(
            process.ENV_CONFIG.BAG_SERVER_IP,
            process.ENV_CONFIG.BAG_SERVER_PORT,
            "/get_award",
            params
        )
        logger.debug("被邀请者：游戏奖励", JSON.stringify(result));
        const tmp = play_users.splice(0, play_users.length);
        const awards = result.data;
        if (result.code == 0) {
            await Promise.all(tmp.map(async user_id => {
                const result = await http_client.http_post_async(
                    process.ENV_CONFIG.USER_SERVER_IP,
                    process.ENV_CONFIG.USER_SERVER_PORT,
                    "/get_inviter",
                    {
                        // user: number[];             // 批量支持
                        user: user_id,
                    }
                )
                if (result.data) {
                    await http_client.http_post_async(
                        process.ENV_CONFIG.USER_SERVER_IP,
                        process.ENV_CONFIG.USER_SERVER_PORT,
                        "/send_mail_to_user",
                        {
                            // user: number[];             // 批量支持
                            // sender: string;             // 发件人昵称（系统邮件）
                            // send_time: number;          // 发送时间（支持定时发送）

                            // title: string;              // 标题
                            // content: string;            // 内容
                            // attachs?: string;            // 附件 key:道具名称 value:道具数量   
                            user: [result.data.inviter],
                            sender: "系统邮件",
                            content: `你邀请的好友（${user_id}）玩了一局游戏(${process.ENV_CONFIG.NAME})，获得以下奖励`,
                            send_time: 0,
                            title: "好友完成了一局游戏",
                            attachs: awards,
                        }
                    )
                }
            }))
        }
    }

    setTimeout(deal_inviter_awards_async, 1000 * 60); // 一分钟处理一次 
}

(async () => {
    await deal_inviter_awards_async();
})()