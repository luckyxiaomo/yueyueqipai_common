/**
 * 统计的键值
 */

exports.statistic_key ={

    /////////////////全局统计///////////////////////
    //累加
    WIN_COUNTS:1,     //赢的总次数
    JOIN_COUNTS:2,    //参与游戏的总次数


    //最大
    MAX_WIN_SCORE:3,    //最大赢取的分数
    MAX_LOSE_SCORE:4,   //最大输的分数

    //最小


    SHARE_COUNTS:50,     //分享次数
    CALL_JOIN_COUNTS:51, //邀请加入的玩家总数
    LEVEL_AWARD_MASK:52, //等级奖励掩码

    //////////////////分类统计////////////////////////
    ////跑得快100////
    RUNNING_JOIN_COUNT:100,     //参与次数
    RUNNING_WIN_COUNT:101,      //赢的次数

    RUNNING_WIN_MAX_SCORE:102,  //赢的最大分数
    RUNNING_LOSE_MAX_SCORE:103, //输的最大分数

    ////斗地主200////
    LANDLORD_JOIN_COUNT:200,    //参与次数
    LANDLORD_WIN_COUNT:201,     //赢的次数

    LANDLORD_WIN_MAX_SCORE:202, //赢的最大分数
    LANDLORD_LOSE_MAX_SCORE:203,//输的最大分数

    LANDLORD_LANDLORD_COUNT:250,//当地主的次数
    ////牛牛300//////
    OX_JOIN_COUNT:300,           //参与次数
    OX_WIN_COUNT:301,            //赢的次数

    OX_WIN_MAX_SCORE:302,         //赢的最大分数
    OX_LOSE_MAX_SCORE:303,        //输的最大分数

    OX_MAX_CARD:399,              //最大手牌

    ////炸金花400///////
    GF_JOIN_COUNT:400,           //参与次数
    GF_WIN_COUNT:401,            //赢的次数

    GF_WIN_MAX_SCORE:402,         //赢的最大分数
    GF_LOSE_MAX_SCORE:403,        //输的最大分数

    GF_MAX_CARD:499,              //金花最大手牌
    ////德州扑克500/////
    TAXAS_JOIN_COUNT:500,           //参与次数
    TAXAS_WIN_COUNT:501,            //赢的次数

    TAXAS_WIN_MAX_SCORE:502,         //赢的最大分数
    TAXAS_LOSE_MAX_SCORE:503,        //输的最大分数

    TAXAS_MAX_CARD:599,              //德州最大手牌

    ////跑胡子600///////

    ////21点700/////////
    P21_JOIN_COUNT:700,           //参与次数
    P21_WIN_COUNT:701,            //赢的次数

    P21_WIN_MAX_SCORE:702,         //赢的最大分数
    P21_LOSE_MAX_SCORE:703,        //输的最大分数

    P21_MAX_CARD:799,              //21点最大手牌
    ////三公800/////////
    SANGONG_JOIN_COUNT:800,           //参与次数
    SANGONG_WIN_COUNT:801,            //赢的次数

    SANGONG_WIN_MAX_SCORE:802,         //赢的最大分数
    SANGONG_LOSE_MAX_SCORE:803,        //输的最大分数

    SANGONG_MAX_CARD:899,              //三公最大手牌
    ////十三水900///////
    SHISS_JOIN_COUNT:900,           //参与次数
    SHISS_WIN_COUNT:901,            //赢的次数

    SHISS_WIN_MAX_SCORE:902,         //赢的最大分数
    SHISS_LOSE_MAX_SCORE:903,        //输的最大分数

    SHISS_MAX_CARD:999,              //十三水最大手牌
    ////三打哈1000//////
    SDH_JOIN_COUNT:1000,           //参与次数
    SDH_WIN_COUNT:1001,            //赢的次数

    SDH_WIN_MAX_SCORE:1002,         //赢的最大分数
    SDH_LOSE_MAX_SCORE:1003,        //输的最大分数

    ////10点半1100//////
    P105_JOIN_COUNT:1100,           //参与次数
    P105_WIN_COUNT:1101,            //赢的次数

    P105_WIN_MAX_SCORE:1102,         //赢的最大分数
    P105_LOSE_MAX_SCORE:1103,        //输的最大分数

    P105_MAX_CARD:1199,              //10点半最大手牌

    ///飞行棋1200//////
    FLIGHT_JOIN_COUNT:1200,         //飞行棋加入次数
    FLIGHT_WIN_COUNT:1201,          //飞行棋赢取次数
    FLIGHT_WIN_MAX_SCORE:1202,      //飞行棋赢的最大分数
    FLIGHT_LOSE_MAX_SCORE:1203,     //飞行棋输的最多分数
    FLIGHT_MAX_FLIGHT:1299,

    ///乐清麻将1300//////
    MJ_YUEQING_JOIN_COUNT:1300,         //乐清麻将参与次数
    MJ_YUEQING_WIN_COUNT:1301,          //乐清麻将赢取次数
    MJ_YUEQING_WIN_MAX_SCORE:1302,      //乐清麻将赢的最大分数
    MJ_YUEQING_LOSE_MAX_SCORE:1303,     //乐清麻将输的最多分数
    MJ_YUEQING_MAX_FLIGHT:1399,

    ///四色牌1400//////
    FOUR_COLOR_JOIN_COUNT:1400,         //四色牌参与次数
    FOUR_COLOR_WIN_COUNT:1401,          //四色牌赢取次数
    FOUR_COLOR_WIN_MAX_SCORE:1402,      //四色牌赢的最大分数
    FOUR_COLOR_LOSE_MAX_SCORE:1403,     //四色牌输的最多分数
    FOUR_COLOR_MAX_FLIGHT:1499,

    ///桂林字牌1500//////
    WORD_POKER_GUILIN_JOIN_COUNT:1500,         //桂林字牌参与次数
    WORD_POKER_GUILIN_WIN_COUNT:1501,          //桂林字牌赢取次数
    WORD_POKER_GUILIN_WIN_MAX_SCORE:1502,      //桂林字牌赢的最大分数
    WORD_POKER_GUILIN_LOSE_MAX_SCORE:1503,     //桂林字牌输的最多分数
    WORD_POKER_GUILIN_MAX_FLIGHT:1599,

    ///温州麻将1600//////
    MJ_WENZHOU_JOIN_COUNT:1600,         //温州麻将参与次数
    MJ_WENZHOU_WIN_COUNT:1601,          //温州麻将赢取次数
    MJ_WENZHOU_WIN_MAX_SCORE:1602,      //温州麻将赢的最大分数
    MJ_WENZHOU_LOSE_MAX_SCORE:1603,     //温州麻将输的最多分数
    MJ_WENZHOU_MAX_FLIGHT:1699,

    ///福州麻将1700//////
    MJ_FUZHOU_JOIN_COUNT:1700,         //福州麻将参与次数
    MJ_FUZHOU_WIN_COUNT:1701,          //福州麻将赢取次数
    MJ_FUZHOU_WIN_MAX_SCORE:1702,      //福州麻将赢的最大分数
    MJ_FUZHOU_LOSE_MAX_SCORE:1703,     //福州麻将输的最多分数
    MJ_FUZHOU_MAX_FLIGHT:1799,

    ////扒锅1800//////
    PG_JOIN_COUNT:1800,           //参与次数
    PG_WIN_COUNT:1801,            //赢的次数
    PG_WIN_MAX_SCORE:1802,         //赢的最大分数
    PG_LOSE_MAX_SCORE:1803,        //输的最大分数
    PG_MAX_FLIGHT:1899,

    ////都昌栽宝1900//////
    MJ_DUCHANG_JOIN_COUNT:1900,           //参与次数
    MJ_DUCHANG_WIN_COUNT:1901,            //赢的次数
    MJ_DUCHANG_WIN_MAX_SCORE:1902,         //赢的最大分数
    MJ_DUCHANG_LOSE_MAX_SCORE:1903,        //输的最大分数
    MJ_DUCHANG_MAX_FLIGHT:1899,

    ////长沙跑胡子2000//////
    WORD_POKER_CS_PHZ_JOIN_COUNT:2000,           //参与次数
    WORD_POKER_CS_PHZ_WIN_COUNT:2001,            //赢的次数
    WORD_POKER_CS_PHZ_WIN_MAX_SCORE:2002,         //赢的最大分数
    WORD_POKER_CS_PHZ_LOSE_MAX_SCORE:2003,        //输的最大分数
    WORD_POKER_CS_PHZ_MAX_FLIGHT:2099,

    ////衡阳六胡抢2100//////
    WORD_POKER_HY_LHQ_JOIN_COUNT:2100,           //参与次数
    WORD_POKER_HY_LHQ_WIN_COUNT:2101,            //赢的次数
    WORD_POKER_HY_LHQ_WIN_MAX_SCORE:2102,         //赢的最大分数
    WORD_POKER_HY_LHQ_LOSE_MAX_SCORE:2103,        //输的最大分数
    WORD_POKER_HY_LHQ_MAX_FLIGHT:2199,

    ///怀化红拐弯2200//////
    WORD_POKER_HH_HGW_JOIN_COUNT:2200,           //参与次数
    WORD_POKER_HH_HGW_WIN_COUNT:2201,            //赢的次数
    WORD_POKER_HH_HGW_WIN_MAX_SCORE:2202,         //赢的最大分数
    WORD_POKER_HH_HGW_LOSE_MAX_SCORE:2203,        //输的最大分数
    WORD_POKER_HH_HGW_MAX_FLIGHT:2299,

    ///娄底放炮罚2300//////
    WORD_POKER_LD_FPF_JOIN_COUNT:2300,           //参与次数
    WORD_POKER_LD_FPF_WIN_COUNT:2301,            //赢的次数
    WORD_POKER_LD_FPF_WIN_MAX_SCORE:2302,         //赢的最大分数
    WORD_POKER_LD_FPF_LOSE_MAX_SCORE:2303,        //输的最大分数
    WORD_POKER_LD_FPF_MAX_FLIGHT:2399,

    ///岳阳歪胡子2400//////
    WORD_POKER_YY_WHZ_JOIN_COUNT:2400,           //参与次数
    WORD_POKER_YY_WHZ_WIN_COUNT:2401,            //赢的次数
    WORD_POKER_YY_WHZ_WIN_MAX_SCORE:2402,         //赢的最大分数
    WORD_POKER_YY_WHZ_LOSE_MAX_SCORE:2403,        //输的最大分数
    WORD_POKER_YY_WHZ_MAX_FLIGHT:2499,

    ///常德全名堂2500//////
    WORD_POKER_CD_QMT_JOIN_COUNT:2500,           //参与次数
    WORD_POKER_CD_QMT_WIN_COUNT:2501,            //赢的次数
    WORD_POKER_CD_QMT_WIN_MAX_SCORE:2502,         //赢的最大分数
    WORD_POKER_CD_QMT_LOSE_MAX_SCORE:2503,        //输的最大分数
    WORD_POKER_CD_QMT_MAX_FLIGHT:2599,

    ///长沙麻将2600/////
    MJ_CHANGSHA_JOIN_COUNTS:2600,
    MJ_CHANGSHA_WIN_COUNT:2601,
    MJ_CHANGSHA_WIN_MAX_SCORE:2602,
    MJ_CHANGSHA_LOSE_MAX_SCORE:2603,
    MJ_CHANGSHA_MAX_HANDS:2699,

    ///转转麻将2700/////
    MJ_ZHUANZHUAN_JOIN_COUNTS:2700,
    MJ_ZHUANZHUAN_WIN_COUNT:2701,
    MJ_ZHUANZHUAN_WIN_MAX_SCORE:2702,
    MJ_ZHUANZHUAN_LOSE_MAX_SCORE:2703,
    MJ_ZHUANZHUAN_MAX_HANDS:2799,

    ///红中麻将2800/////
    MJ_HONGZHONG_JOIN_COUNTS:2800,
    MJ_HONGZHONG_WIN_COUNTS:2801,
    MJ_HONGZHONG_WIN_MAX_SCORE:2802,
    MJ_HONGZHONG_LOSE_MAX_SCORE:2803,
    MJ_HONGZHONG_MAX_HANDS:2899,

    ///桂柳麻将2900/////
    MJ_GUILIU_JOIN_COUNTS:2900,
    MJ_GUILIU_WIN_COUNTS:2901,
    MJ_GUILIU_WIN_MAX_SCORE:2902,
    MJ_GUILIU_LOSE_MAX_SCORE:2903,
    MJ_GUILIU_MAX_HANDS:2999
}