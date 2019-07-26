var db = require('../database');
var moment = require('moment');
var logger = require("../log").logger;

var activity_configs = [];

exports.init = function(){
    exports.load_activitys(function(success){
        if(success){
            logger.info("load activitys success!!!");
        } else {
            logger.info("load activitys failed!!!");
        }
    });
}

//加载活动.
exports.load_activitys = function (call_back) {
    db.query_activitys(function (rows) {
        if (rows) {
            activity_configs = [];
            for (var i = 0; i < rows.length; i++) {
                var activity = {
                    activity_type: rows[i].activity_type,
                    server_type: rows[i].server_type,
                    begin_time: rows[i].begin_time,
                    end_time: rows[i].end_time,
                };
                activity_configs.push(activity);
            }
            call_back(true);
        } else {
            call_back(false);
        }
    });
}

//根据服务类型获取活动信息
exports.get_active_activitys_by_server_type = function(server_type) {
    var activitys = [];
    var now = moment().unix();
    for(var i = 0; i < activity_configs.length; i++) {
        var activity = activity_configs[i];
        if(activity.server_type != server_type){
            continue;
        }
        if(activity.begin_time != -1 && activity.begin_time > now) {
            continue;
        }
        if(activity.end_time != -1 && activity.end_time < now) {
            continue;
        }
        activitys.push(activity);
    }
    return activitys;
}

//根据活动类型获取活动信息
exports.get_active_activitys_by_activity_type = function(activity_type) {
    var activitys = [];
    var now = moment().unix();
    // logger.info("now---->", now);
    for(var i = 0; i < activity_configs.length; i++) {
        var activity = activity_configs[i];
        if(activity.activity_type != activity_type){
            continue;
        }
        if(activity.begin_time != -1 && activity.begin_time > now) {
            continue;
        }
        if(activity.end_time != -1 && activity.end_time < now) {
            continue;
        }
        activitys.push(activity);
    }
    return activitys;
}

//获取所有活动信息
exports.get_active_activitys = function() {
    return activity_configs;
}