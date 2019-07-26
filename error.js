/**
 *error mudule function
 * **/
var error ={
	//common 全局消息
	SUCCESS:0,
    FAILED:1,
    
    TIME_OUT:3, //超时

	//system 系统模块 100
	SYSTEM_ARGS_ERROR:100,//系统参数错误
	SYSTEM_CHECK_ERROR:101,//系统校验错误

    //sever模块
    SERVER_NOT_FOUND:200,//请求服务器不存在
    SERVER_TYPE_NOT_FOUND:201,//服务器组不存在
    SERVER_ADDR_NOT_FOUND:202,//查找服务器地址失败
    SERVER_RE_FIND_DB_ERROR:203,//重定向服务器地址失败
    SERVER_CODE_NONE:204,//SEVERCODE错误
    //user
    USER_NOT_FOUND:301,//用户不存在
    USER_NOT_READY:302,//有用户没准备
    USER_STATE_NOT_BETING:303,//不在下注状态
    USER_COIN_NOT_INVALID:304,//下注金额不合法
    USER_BET_TYPE_INVALID:305,//下注类型不合法

    //领取奖励相关错误码
    AWARD_NONE:400,//没有奖励可领取
    AWARD_HAS_REIVE:401,//奖励领取领取
    AWARD_CONDITION_FAILED:402,//还未满足领取条件

    //login 登录模块 1000 
    LOGIN_FAILED_UNDEFINED:1000,//登录失败，未定义错误
    LOGIN_FAILED_WECHATFAILED:1001,//登录失败，微信返回错误
    LOGIN_FAILED_CHECK_ACCOUNT:1002,//登录失败，检测账户返回错误
    LOGIN_FAILED_ACCOUNT_LOCK:1003,//登录失败,账号被锁定，请联系客服

    CREATE_USER_FAILED_EXSIT:1004,//注册失败，用户已经存在
    CREATE_USER_FAILED_OTHER:1004,//注册失败
    //room 房间模块2000
    ROOM_FAILED_UNDEFINED:2000,//房间操作失败，未定义错误
    //2001
    ROOM_CREATE_ARGS_ERROR:2001,//创建房间失败，参数不合法
    ROOM_CREATE_CHECK_FAILED:2002,//创建房间失败，校验不合法
    ROOM_CREATE_RULE_CHECK_ERROR:2003,//规则检验不合法
    ROOM_CREATE_ROOM_TYPE_ERROR:2004,//房间类型错误
    ROOM_CREATE_ROOM_HAS_RUNNING:2005,//创建失败，已经在游戏中
    ROOM_CREATE_INGOT_NOT:2006,//创建房间失败，房卡不够
    ROOM_CREATE_GOLD_NOT:2007,//创建房间失败，钻石不够
    AGENT_ROOM_ONLY_INGOT:2008,//创建房间失败，只能创建房卡游戏
    ROOM_HAS_PLAYER:2009,//房间里有玩家在，无法删除房间

    //2100
    ROOM_ENTER_ARGS_ERROR:2101,//进入房间失败，参数不合法
    ROOM_ENTER_CHECK_FAILED:2102,//进入房间失败，检验不合法
    ROOM_ENTER_ROOM_FULL:2103,//进入房间失败，房间已满
    ROOM_ENTER_EXSITS:2104,//进入房间失败，玩家已经在房间
    ROOM_ENTER_NOT_FOUND:2105,//进入房间失败，未找到房间
    ROOM_ENTER_GOLD_NOT:2106,//进入房间失败，钻石不足
    ROOM_ENTER_NOT_NEW:2107, //进入房间失败，游戏已开始，不允许新进玩家

    //2200 投诉建议
    ADVICE_ERROR_UNDEFINED:2200,//投诉建议错误未定义
    ADVICE_ERROR_ARGS_ERROR:2201,//参数错误
    ADVICE_ERROR_TIME_LIMITED:2202,//才刚刚投诉建议了，请稍等一会儿，或者直接联系客服
    ADVICE_ERROR_TYPE_UNKON:2203,//不能识别的投诉类型，或者未指定
    ADVICE_ERROR_GAME_UNKON:2204,//不能识别投诉的游戏类型，或者未指定
    ADVICE_ERROR_NOT_MORE:2205,//没有更多的记录
    ADVICE_ERROR_NOT_FOUND:2206,//未找到相关投诉建议

    //2300 邮件错误
    MAIL_ERROR_UNDEFINED:2300,//游戏错误未定义
    MAIL_ERROR_DATA_FAILED:2301,//组织数据错误
    MAIL_ERROR_NOT_MORE:2302,//没有更多的邮件
    MAIL_ERROR_OPERATE_UNKONW:2303,//操作邮件未知错误
    MAIL_ERROR_RECIVE_FAILD:2304,//领取邮件奖励错误
    MAIL_ERROR_HAS_RECIVE_OR_NOT_EXSISTS:2305,//邮件奖励已领取或邮件不存在
    
    //俱乐部相关功能
    CLUB_AGENT_UNDEFINED:2400,//俱乐部操作未定义错误
    CLUB_AGENT_EXSIST:2401,//已经有俱乐部
    CLUB_AGENT_NOT_FOUND:2402,//未找到俱乐部
    CLUB_AGENT_GAME_NONE:2403,//未找到俱乐部创建者
    CLUB_AGENT_ACCESS_REJECT:2404,//未授权

    //game  5000
    GAME_ERROR_UNDEFINED:5000,//游戏操作错误，未定义错误
    GAME_ERROR_CARD_INVALID:5001,//卡牌不合法
    GAME_ERROR_PLAYER_NOT_FOUND:5002,//玩家未找到
    GAME_ERROR_NOT_TURN:5003,//未到出牌的顺序
    GAME_ERROR_CARD_TYPE_INVALID:5004,//出牌类型错误
    GAME_ERROR_MUST_OUT:5005,//必须出牌
    GAME_ERROR_MUST_BIG:5006,//出单牌的时候，如果下家是单牌，必须检测最大值

    //21点用户操作
    POINT_OP_INVALIED:5100,//用户操作未定义
    POINT_OP_HIT_NOT:5101, //不能继续要牌
    POINT_OP_STAND_BANKER_LESS:5102,//庄家没要到16点，不允许停牌
    POINT_OP_CONI_LESS:5103,    //押注太少
    POINT_OP_STAND_BANKER_MAX:5104, //庄家达到17点以上时，不能再要牌

    //13水操作
    SHISANSHUI_CHOSE_DATA_FAILED:5200,//数据格式错误
    SHISANSHUI_CHOSE_CARD_INVALID:5201,//卡牌不合法
    SHISANSHUI_CHOSE_OUT_TYPE_FAILED:5202,//大类型错误
    SHISANSHUI_CHOSE_STAGE_FAILED:5203,//墩出错
    SHISANSHUI_CHOSE_NOT_ALLOW_SPACIAL:5204,//不允许特殊类型

    //乐清麻将操作
    YUEQING_GOD_WEALTH_NO_OUT:5300,//财神不能出.
    YUEQING_HAS_OTHER_OPERATE:5301,//还有操作未进行.
    YUEQING_ALREADY_OUT:5302,//已经出过牌了.

    //飞行棋操作
    FLIGHT_ERROR_COLOR_CHOSEN:5400,//手太慢了，该方位已经被玩家抢占了。

    //温州麻将操作
    MJ_WZ_HOLDS_HAS_SINGLE_FENG:5500,//手中还有单张风牌。
    MJ_WZ_MUST_GEN_FENG:5501,//必须跟风。

    //比赛错误码
    MATCH_NO_HAS_TYPE:6000,//没有此比赛。
    MATCH_ALREADY_JOIN:6001,//已经报名了。
    MATCH_JOIN_FAILED:6002,//报名失败了。
    MATCH_SERVER_NO_FIND:6003,//比赛服务器未找到。
    MATCH_CANCEL_FAILED:6004,//取消报名失败。
    MATCH_NO_JOIN:6005,//玩家没有报名该比赛。
    MATCH_HAS_BEGIN:6006,//比赛已经开始。

    //公会（俱乐部）
    JOIN_UNION_MAX_LIMIT:6501,//加入公会已达限制
    UNION_NAME_ALREADY_EXIST:6502,//公会名称已存在
    UNION_NAME_TOO_LONG:6503,//公会名称太长
    UNION_PERMISSION_LIMIT:6504,//公会权限不足
    UNION_NAME_SAME:6505,//公会名称相同
    UNION_ALREADY_JOIN:6506,//您已加入
    UNION_ALREADY_APPLY:6507,//您已申请加入
    UNION_ALREADY_SHIELD:6508,//您已被屏蔽
    UNION_APPLY_NO_EXIST:6509,//没有此申请
    UNION_MEMBER_NO_EXIST:6510,//您不是公会成员
    UNION_IS_MANAGER:6511,//您是管理员
    UNION_NO_DELETE_SELF:6512,//不能删除自己
    UNION_NO_EXIST:6513,//公会不存在
    UNION_INVITE_NO_EXIST:6514,//公会邀请不存在
    UNION_ALREADY_INVITE:6515,//玩家已被邀请
    UNION_NO_SET_CREATE_CONF:6516,//请先设置自动创建房间规则

    //支付模块
    PAY_FAILED_UNDEFINED:8000,//支付错误未定义
    PAY_ARG_CHECK_FAILED:8001,//支付参数错误
    PAY_CHECK_FAILED:8002,//支付校验错误
    PAY_CHECK_USER_NOT:8003,//支付账户不存在
    PAY_CHECK_WAIT:8004,//有支付订单正在处理，请稍后再试
    PAY_ITEM_ERROR:8005,//支付商品不存在
    PAY_REQ_FAILED:8006,//请求验证失败

    PAY_APP_CHECK_FAILED_UNDEFINED:8100,//支付苹果校验未知错误
    PAY_APP_CHECK_FAILED:8101,//支付苹果校验出错，请稍后再试
    PAY_APP_CHECK_NONE:8102,//支付信息不存在
    PAY_APP_CHECK_ITEM_NONE:8103,//支付物品信息不匹配
    PAY_APP_ITEM_ID_FAILED:8104,//支付itemid不匹配
    PAY_APP_ORDER_NOT_MATCH:8105,//订单不匹配
    PAY_APP_APP_ID_NOT_MATCH:8106,//appid不匹配
    PAY_APP_PAYED:8107,//支付已验证

    //app store 错误码
    // 21000App Store无法读取你提供的JSON数据
    // 21002 收据数据不符合格式
    // 21003 收据无法被验证
    // 21004 你提供的共享密钥和账户的共享密钥不一致
    // 21005 收据服务器当前不可用
    // 21006 收据是有效的，但订阅服务已经过期。当收到这个信息时，解码后的收据信息也包含在返回内容中
    // 21007 收据信息是测试用（sandbox），但却被发送到产品环境中验证
    // 21008 收据信息是产品环境中使用，但却被发送到测试环境中验证


    //后台模块
    //钻石
    WEB_ADD_INGOT_ERROR_UNDEFINED:8200,//插入钻石未定义错误
    WEB_ADD_INGOT_ERROR_DB_ERROR:8201,//后台插入钻石数据库错误
    WEB_ADD_INGOT_ERROR_USER_NOT_FOUND:8202,//未找到对应玩家
    //金币
    WEB_ADD_GOLD_ERROR_UNDEFINED:8300,//插入金币未定义错误
    WEB_ADD_GOLD_ERROR_DB_ERROR:8301,//插入金币数据库错误
    WEB_ADD_GOLD_ERROR_USER_NOT_FOUND:8302,//插入金币未找到玩家

    //web支付相关模块
    WEB_PAY_DATA_ERROR:8400,//数据个数错误
    WEB_PAY_PLAYFROM_NONE:8401,//支付平台错误
    WEB_PAY_PAYINFO_NONE:8402, //支付信息错误
    WEB_WECHAT_XML_ERROR:8403,//解析微信放回错误
    WEB_WECHAT_BACK_FAILD1:8404,//订单微信返回错误1
    WEB_WECHAT_BACK_FAILD2:8405,//订单微信返回错误2
    WEB_WECHAT_LOAD_DATA_ERROR:8406,//加载付费数据错误
    WEB_WECHAT_REQ_DATA_ERROR:8407,//请求数据错误。
    WEB_WECHAT_WECHAT_NOT_NOTIFY:8408,//支付订单微信未回调，请等待
    WEB_WECHAT_WECHAT_NOTIFY_OUTTIME:8409,//微信回调通知超时
    WEB_WECHAT_VERTIFY_SIGN_ERROR:8410,//查询订单返回的sign错误
    PAY_H5_VERTIFY_ERROR1:8411,//h5主动验证ERROR1
    PAY_H5_VERTIFY_ERROR2:8412,//h5主动验证ERROR2
    PAY_H5_NOT_FINISH:8413,//h5支付还未完成,
    WEB_WECHAT_PAY_INVALIED:8414,//h5支付订单不匹配
}

exports.error = error;