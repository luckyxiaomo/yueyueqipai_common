/**
 * 升级信息
 */

var exp_config ={
    //默认配置
    'default':{
        win:6,  //赢
        lose:-2,//输
        draw:2, //平局
        banker:0,//庄家额外
        lucky:1, //幸运值
    }
}

var level_award_config ={
    //青铜2奖励
    2:{
        gold:1,
        ingot:0
    },
    //青铜1奖励
    3:{
        gold:2,
        ingot:0
    },
    //白银3奖励
    4:{
        gold:3,
        ingot:0
    },
    //白银2奖励
    5:{
        gold:5,
        ingot:0
    },
    //白银1奖励
    6:{
        gold:8,
        ingot:0
    },
    //黄金3奖励
    7:{
        gold:12,
        ingot:0
    },
    //黄金2奖励
    8:{
        gold:20,
        ingot:0
    },
    //黄金1奖励
    9:{
        gold:30,
        ingot:0
    },
    //铂金3奖励
    10:{
        gold:50,
        ingot:0
    },
    //铂金2奖励
    11:{
        gold:80,
        ingot:0
    },
    //铂金1奖励
    12:{
        gold:120,
        ingot:0
    },
    //钻石3奖励
    13:{
        gold:200,
        ingot:0
    },
    //钻石2奖励
    14:{
        gold:300,
        ingot:0
    },
    //钻石1奖励
    15:{
        gold:500,
        ingot:0
    },
    //至尊王者奖励
    16:{
        gold:1000,
        ingot:0
    }
}


var MAX_LEVEL = 16;

function get_level_up_exp(level){
    // return Math.floor(level*level *1000 +1000 + Math.pow(Math.log(level),3)*5000*level*level);
    return 10 *Math.pow(2,(level -1))
}


/**
 * 获取等级奖励
 * @param {*} level 
 */
exports.get_level_award = function(level){
    return level_award_config[level]
}

/**
 * 获取经验和幸运值
 * @param {*} server_type 
 * @param {*} banker 
 * @param {*} win  1 赢 -1 输  0 平局
 */
exports.get_exp_lucky = function(server_type,banker,win){
    var cnf =exp_config[server_type];
    if(!cnf){
        cnf = exp_config['default'];
    }
    var info ={
        exp:0,
        lucky:0,
    };
    if(win == 1){
        info.exp +=cnf.win;
    }else if(win == -1){
        info.exp +=cnf.lose;
    }else if(win ==0){
        info.exp += cnf.draw;
    }
    if(banker){
        info.exp +=cnf.banker;
    }
    info.lucky = cnf.lucky;

    return info;
}
//添加经验，返回当前的等级和经验(现在可能倒退等级)
//达到最高等级时，经验仅仅是累加
exports.add_exp = function(level,exp,add_exp){
    var info ={
        level:level,
        exp:exp,
    }
    var need_exp = get_level_up_exp(level);
    var now_exp = exp +add_exp;
    if(now_exp >= need_exp){
        if(info.level >= MAX_LEVEL){
            info.exp = now_exp
            return info;
        }
        info.level +=1;
        info.exp = now_exp -need_exp;
        if(info.exp >= get_level_up_exp(info.level)){
            info = exports.add_exp(info.level,info.exp,0);
        }
    }else{
        if(now_exp < 0){
            if(level == 1){
                info.exp =0;
            }else{
                var pre_exp = get_level_up_exp(level-1);
                info.level = level -1;
                info.exp = pre_exp + now_exp;
                if(info.exp < 0 ){
                    info = exports.add_exp(info.level,info.exp,0)
                }
            }
        }else{
            info.exp += add_exp;
        }
    }
    return info;
}