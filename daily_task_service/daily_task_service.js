const path = require("path");
const log4js = require('../utils/log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

var all_task_conf = require('./data/daily_task').daily_task;
if (process.ENV_CONFIG.ENV == 'youyou') {
    all_task_conf = require('./data/daily_task_youyou').daily_task_youyou;
}
// var db = require("../../utils/db");
//new 数据库
var db = require('../database');
const global_setting = require('./global_setting').global;
var moment = require('moment');
const money_service = require("../money_service/money_service");

//查询任务（日常任务、周常任务)
exports.get_daily_and_week_tasks = function (user_id, call_back) {
    db.get_daily_and_week_tasks(user_id, function (ret) {
        if (!ret) {
            call_back(false);
            return;
        }
        var daily_task = [];
        if (ret.daily_task) {
            daily_task = JSON.parse(ret.daily_task.toString('utf8'));
        }
        var week_task = [];
        if (ret.week_task) {
            week_task = JSON.parse(ret.week_task.toString('utf8'));
        }
        var daily_task_clear_time = ret.daily_task_clear_time;
        var week_task_clear_time = ret.week_task_clear_time;

        //重置日常、周常任务.
        daily_task = exports.reset_daily_tasks(user_id, daily_task, daily_task_clear_time);
        week_task = exports.reset_week_tasks(user_id, week_task, week_task_clear_time);

        var all_task_data = {};
        all_task_data[global_setting.TASK_TYPE_DAILY] = [];
        all_task_data[global_setting.TASK_TYPE_WEEK] = [];
        //日常任务
        for (var i = 0; i < daily_task.length; i++) {
            var task_id = daily_task[i][0];
            var task_conf = all_task_conf[task_id];
            var task_data = {
                task_id: task_id,
                name: task_conf.name,
                describe: task_conf.describe,
                target_type: task_conf.target_type,
                target: task_conf.target,
                reward: task_conf.reward,
                schedule: daily_task[i][3],
                status: daily_task[i][4],   //状态值===>（0:进行中，1：已完成，2：已领取）
            };
            all_task_data[global_setting.TASK_TYPE_DAILY].push(task_data);
        }
        //周常任务
        for (var i = 0; i < week_task.length; i++) {
            var task_id = week_task[i][0];
            var task_conf = all_task_conf[task_id];
            var task_data = {
                task_id: task_id,
                name: task_conf.name,
                describe: task_conf.describe,
                target_type: task_conf.target_type,
                target: task_conf.target,
                reward: task_conf.reward,
                schedule: week_task[i][3],
                status: week_task[i][4],   //状态值===>（0:进行中，1：已完成，2：已领取）
            };
            all_task_data[global_setting.TASK_TYPE_WEEK].push(task_data);
        }
        call_back(all_task_data);
    });
}

//更新任务进度.(日常任务、周常任务)
exports.update_daily_and_week_task = function (user_id, target_schedules) {
    db.get_daily_and_week_tasks(user_id, function (ret) {
        if (!ret) {
            return;
        }
        var daily_task = [];
        if (ret.daily_task) {
            daily_task = JSON.parse(ret.daily_task.toString('utf8'));
        }
        var week_task = [];
        if (ret.week_task) {
            week_task = JSON.parse(ret.week_task.toString('utf8'));
        }
        var daily_task_clear_time = ret.daily_task_clear_time;
        var week_task_clear_time = ret.week_task_clear_time;

        //重置日常、周常任务.
        daily_task = exports.reset_daily_tasks(user_id, daily_task, daily_task_clear_time);
        week_task = exports.reset_week_tasks(user_id, week_task, week_task_clear_time);

        var modify = false;
        for (var k = 0; k < target_schedules.length; k++) {
            var target_type = target_schedules[k].target_type;
            var add_schedule = target_schedules[k].add_schedule;
            //日常任务
            for (var i = 0; i < daily_task.length; i++) {
                if (daily_task[i][1] == target_type && daily_task[i][4] != 2 && daily_task[i][3] < daily_task[i][2]) {
                    daily_task[i][3] += add_schedule;
                    //判断任务是否完成， 如果完成修改任务状态为：已完成.
                    if (daily_task[i][3] >= daily_task[i][2] && daily_task[i][4] == 0) {
                        daily_task[i][3] = daily_task[i][2];
                        daily_task[i][4] = 1;
                    }
                    modify = true;
                }
            }
            //周常任务
            for (var i = 0; i < week_task.length; i++) {
                if (week_task[i][1] == target_type && week_task[i][4] != 2 && week_task[i][3] < week_task[i][2]) {
                    week_task[i][3] += add_schedule;
                    //判断任务是否完成， 如果完成修改任务状态为：已完成.
                    if (week_task[i][3] >= week_task[i][2] && week_task[i][4] == 0) {
                        week_task[i][3] = week_task[i][2]
                        week_task[i][4] = 1;
                    }
                    modify = true;
                }
            }
        }
        //判断任务是否修改，如果修改则需要更新数据库.
        if (modify) {
            db.update_daily_and_week_task(user_id, JSON.stringify(daily_task), JSON.stringify(week_task), function (success) {
                if (!success) {
                    logger.debug("update daily and week tasks error!!!");
                }
            });
        }

    });
}

//领取任务奖励.(日常任务、周常任务)
exports.get_task_reward = function (user_id, task_id, call_back) {
    // logger.debug("user_id===>", user_id, "  task_id====>", task_id);
    db.get_daily_and_week_tasks(user_id, async function (ret) {
        if (!ret) {
            call_back(false);
            return;
        }
        var daily_task = [];
        if (ret.daily_task) {
            daily_task = JSON.parse(ret.daily_task.toString('utf8'));
        }
        var week_task = [];
        if (ret.week_task) {
            week_task = JSON.parse(ret.week_task.toString('utf8'));
        }
        var daily_task_clear_time = ret.daily_task_clear_time;
        var week_task_clear_time = ret.week_task_clear_time;

        //重置日常、周常任务.
        daily_task = exports.reset_daily_tasks(user_id, daily_task, daily_task_clear_time);
        week_task = exports.reset_week_tasks(user_id, week_task, week_task_clear_time);

        var task_conf = all_task_conf[task_id];
        if (!task_conf) {
            call_back(false);
            return;
        }
        if (task_conf.status != 1) {
            call_back(false);
            return;
        }
        if (task_conf.task_type == global_setting.TASK_TYPE_DAILY) {
            var cur_task = null;
            for (var i = 0; i < daily_task.length; i++) {
                if (daily_task[i][0] == task_id) {
                    cur_task = daily_task[i];
                    break;
                }
            }
            if (!cur_task) {
                call_back(false);
                return;
            }
            if (cur_task[4] != 1) {
                call_back(false);
                return;
            }
            //开始结算奖励.
            await send_task_reward_async(user_id, JSON.parse(task_conf.reward));

            //更新任务状态.
            cur_task[4] = 2;
            db.update_daily_and_week_task(user_id, JSON.stringify(daily_task), JSON.stringify(week_task), function (success) {
                if (!success) {
                    logger.debug("update daily and week tasks error!!!");
                }
                var data = {
                    ret: true,
                    reward: task_conf.reward,
                };
                call_back(data);
                return;
            });
        }
        if (task_conf.task_type == global_setting.TASK_TYPE_WEEK) {
            var cur_task = null;
            for (var i = 0; i < week_task.length; i++) {
                if (week_task[i][0] == task_id) {
                    cur_task = week_task[i];
                    break;
                }
            }
            if (!cur_task) {
                call_back(false);
                return;
            }
            if (cur_task[4] != 1) {
                call_back(false);
                return;
            }
            //开始结算奖励.
            await send_task_reward_async(user_id, JSON.parse(task_conf.reward));
            //更新任务状态.
            cur_task[4] = 2;
            db.update_daily_and_week_task(user_id, JSON.stringify(daily_task), JSON.stringify(week_task), function (success) {
                if (!success) {
                    logger.debug("update daily and week tasks error!!!");
                }
                var data = {
                    ret: true,
                    reward: task_conf.reward,
                };
                call_back(data);
                return;
            });
        }
    });
}

async function send_task_reward_async(user_id, reward) {
    for (let i = 0; i < reward.length; i++) {
        let reward_type = reward[i][0];
        let reward_counts = reward[i][1];

        if (reward_type == global_setting.REWARD_TYPE_INGOT) {
            await money_service.add_ingot_async(user_id, reward_counts, `任务奖励`);
        } else if (reward_type == global_setting.REWARD_TYPE_GOLD) {
            await money_service.add_gold_async(user_id, reward_counts, `任务奖励`);
        } else if (reward_type == global_setting.REWARD_TYPE_CAIBEI) {
            await money_service.add_items_async(user_id, [{ itemName: "彩贝", count: reward_counts }], `任务奖励`);
        } else if (reward_type == global_setting.REWARD_TYPE_TURN) {
            db.add_route_counts(user_id, reward_counts, function (err, rows, fields) {
                if (err) {
                    logger.error("get task reward ---- add_route_counts  error!!", err.stack);
                    return;
                }
            });
        }
    }
}

//重置日常任务.
exports.reset_daily_tasks = function (user_id, daily_task, daily_task_clear_time) {
    var now_time = moment().unix();
    if (!daily_task_clear_time || !global_setting.is_same_day(now_time, daily_task_clear_time)) {
        daily_task = init_daily_tasks();
        db.init_daily_tasks(user_id, JSON.stringify(daily_task), now_time, function (success) {
            if (!success) {
                logger.debug("Init daily tasks error!!!!");
            }
        });
    }
    return daily_task;
}

//重置周常任务.
exports.reset_week_tasks = function (user_id, week_task, week_task_clear_time) {
    var now_time = moment().unix();
    if (!week_task_clear_time || !global_setting.is_same_week(now_time, week_task_clear_time)) {
        week_task = init_week_tasks();
        db.init_week_tasks(user_id, JSON.stringify(week_task), now_time, function (success) {
            if (!success) {
                logger.debug("Init week tasks error!!!!");
            }
        });
    }
    return week_task;
}

//初始化日常任务.
function init_daily_tasks() {
    var daily_tasks = [];
    for (var id_key in all_task_conf) {
        var task = all_task_conf[id_key];
        //判断任务（任务被关闭、不是日常任务、不是起始任务）
        if (task.status != 1 || task.task_type != global_setting.TASK_TYPE_DAILY || task.last_task != 0) {
            continue;
        }
        //数组代表含义--> 【任务ID，目标类型，目标，进度，状态】  状态值===>（0:进行中，1：已完成，2：已领取）
        daily_tasks.push([task.id, task.target_type, task.target, 0, 0]);
    }
    return daily_tasks;
}


//初始化周常任务.
function init_week_tasks() {
    var week_tasks = [];
    for (var id_key in all_task_conf) {
        var task = all_task_conf[id_key];
        //判断任务（任务被关闭、不是周常任务、不是起始任务）
        if (task.status != 1 || task.task_type != global_setting.TASK_TYPE_WEEK || task.last_task != 0) {
            continue;
        }
        //数组代表含义--> 【任务ID，目标类型，目标，进度，状态】  状态值===>（0:进行中，1：已完成，2：已领取）
        week_tasks.push([task.id, task.target_type, task.target, 0, 0]);
    }
    return week_tasks;
}

exports.global_setting = global_setting;