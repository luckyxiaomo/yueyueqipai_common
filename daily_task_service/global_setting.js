var moment = require('moment');

var global = {};
//任务类型
global.TASK_TYPE_DAILY = 1;//日常任务
global.TASK_TYPE_WEEK = 2;//周常任务


//奖励类型
global.REWARD_TYPE_INGOT = 1;//房卡
global.REWARD_TYPE_GOLD = 2;//钻石
global.REWARD_TYPE_TURN = 3;//转盘次数


//目标类型
//公用
global.TARGET_TYPE_FIRST_WIN = 1;//首胜.
global.TARGET_TYPE_FINISH_ALL = 2;//成功完成牌局（10/10, 20/20).

//账号
global.TARGET_TYPE_ACCOUNT = 1000;


//大厅
global.TARGET_TYPE_HALL = 2000;


//四川麻将
global.TARGET_TYPE_MJ_SC = 10100;


//乐清麻将
global.TARGET_TYPE_MJ_YQ = 10200;


//长沙麻将
global.TARGET_TYPE_MJ_HN = 10300;


//温州麻将
global.TARGET_TYPE_MJ_WZ = 10400;
global.TARGET_TYPE_MJ_WZ_JOIN = 10401;//参与游戏


//福州麻将
global.TARGET_TYPE_MJ_FZ = 10500;
global.TARGET_TYPE_MJ_FZ_JOIN = 10501;//参与游戏


//转转麻将
global.TARGET_TYPE_MJ_ZZ = 10600;


//红中麻将
global.TARGET_TYPE_MJ_HZ = 10700;


//跑得快
global.TARGET_TYPE_POKER_PDK = 20100;


//斗地主
global.TARGET_TYPE_POKER_DDZ = 20200;


//牛牛
global.TARGET_TYPE_POKER_NN = 20300;


//炸金花
global.TARGET_TYPE_POKER_ZJH = 20400;


//德州扑克
global.TARGET_TYPE_POKER_DZ = 20500;


//跑胡子
global.TARGET_TYPE_POKER_PHZ = 20600;


//21点
global.TARGET_TYPE_POKER_21D = 20700;


//三公
global.TARGET_TYPE_POKER_SG = 20800;


//十三水
global.TARGET_TYPE_POKER_SSS = 20900;


//三打哈
global.TARGET_TYPE_POKER_SDH = 21000;


//10点半
global.TARGET_TYPE_POKER_10DB = 21100;


//飞行棋
global.TARGET_TYPE_OTHER_FXQ = 30100;


//四色牌
global.TARGET_TYPE_OTHER_SSP = 30200;


//桂林字牌
global.TARGET_TYPE_OTHER_GLZP = 30300;


//判断2个时间戳是不是同一天
global.is_same_day = function (t1, t2) {
    var m1 = moment(t1 * 1000);
    var m2 = moment(t2 * 1000);
    if (m1.get('year') == m2.get('year') && m1.get('month') == m2.get('month') && m1.get('day') == m2.get('day')) {
        return true;
    }
    return false;
}

//判断2个时间戳是不是同一周
global.is_same_week = function (t1, t2) {
    var m1 = moment(t1 * 1000);
    var m2 = moment(t2 * 1000);
    if(m1.isoWeek() == m2.isoWeek() && Math.abs(m1.diff(m2, 'days')) <= 7) {
        return true;
    }
    return false;
}

exports.global = global;