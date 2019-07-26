/**
 * 服务器日志管理
 * **/
var logdb = require('./database');
const logger = require("./log").logger;
exports.init = function(where){
    logger.info('%s LOG MANAGER READY.',where);
}
////////////////////////插入记录////////////////////////////////////
exports.insert_ingot_log = function(user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type,callback){
    if(!agent_id){
        agent_id =0;
    }
    if(!server_type){
        server_type =0;
    }

    //记录货币出错的触发点
    if((!value && value != 0)||(!then_value && then_value !=0)){
        logger.error("Ingot log error args error: ",user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type);
    }

    logdb.insert_ingot_log(user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type,callback);
}

exports.insert_gold_log = function(user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type,callback){
    if(!agent_id){
        agent_id =0;
    }
    if(!server_type){
        server_type =0;
    }

    //记录货币出错的触发点
    if((!value && value != 0)||(!then_value && then_value !=0)){
        logger.error("Gold log error args error: ",user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type);
    }

    logdb.insert_gold_log(user_id,from,to,event_type,value,then_value,gtype,platform,channel,agent_id,server_type,callback)
}

exports.insert_login_log = function(user_id,platform,channel,reg_time,ip_info,agent_id){
    if(!agent_id){
        agent_id =0;
    }
    logdb.login_log(user_id,platform,channel,reg_time,ip_info,agent_id);
}

exports.insert_new_come = function(user_id,platform,channel,reg_time,ip_info){
    logdb.reg_log(user_id,platform,channel,reg_time,ip_info);
}

exports.insert_route_log = function(ret){
    logdb.insert_route_log(ret);
}

////////////////////插入开房次数////////////////////////////////////
exports.insert_create_room_log = function(user_id,game_type,type_index,rule_index,room_id,platform,channel,ip_info,agent_id){
    if(!agent_id){
        agent_id =0;
    }
    logdb.insert_create_room_log(user_id,game_type,type_index,rule_index,room_id,platform,channel,ip_info,agent_id);
}

/////////////////////////////获取记录////////////////////////////////
exports.get_route_log = function(user_id,callback){
    logdb.get_route_log(user_id,function(ret){
        callback(ret);
    })
}