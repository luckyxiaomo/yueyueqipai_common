/**
 * 通用http handlers
 */
const http_client = require("../utils/http_client");
var http = require('../http');
var db = require('../database');
var error = require('../error').error;
var log_manager = require('../log_manager');
var activity_global = require('../activity_service/global_setting').global;
const money_service = require('../money_service/money_service')
var ip_service = require('../ip_service/ip_service');
var version = require('../version_service/version_service').version;
var logger = require("../log").logger;
var roomMgr = null;
var userMgr = null;
var tokenMgr = null;
var global = null;

var gameServerInfo = null;
var lastTickTime = 0;
/**
 * 获取IP地理位置
 * @param {*} ip 
 */
function get_ip_info(ip) {
	var ip_info = {
		country: '',
		area: '',
		city: ''
	}
	var ip_data = ip_service.find_sync(ip);
	ip_info.country = ip_data[0];
	ip_info.area = ip_data[1];
	ip_info.city = ip_data[2];

	return ip_info;
}

function show_request(commond, args) {
	if (process.ENV_CONFIG.ENV == 'dev') {
		logger.debug('Http[%s][%s]', commond, args);
	}
}

exports.init = function (room_manager, user_manager, token_manager, log, global_settings, gsf) {
	roomMgr = room_manager;
	userMgr = user_manager;
	tokenMgr = token_manager;
	global = global_settings;
	gameServerInfo = gsf;
}

exports.get_server_info = function (req, res) {
	show_request('/get_server_info  ====>', JSON.stringify(req.query))
	var serverid = req.query.serverid;
	if (serverid != process.ENV_CONFIG.SERVER_ID) {
		http.send(res, error.SYSTEM_ARGS_ERROR, "invalid parameters", null);
		return;
	}

	var locations = roomMgr.getUserLocations();
	var arr = [];
	for (var userId in locations) {
		var roomId = locations[userId].roomId;
		arr.push(userId);
		arr.push(roomId);
	}
	http.send(res, error.SUCCESS, "ok", { userroominfo: arr });
}

exports.create_room_begin = function (req, res) {
	show_request('/create_room_begin  ====>', JSON.stringify(req.query))
	var userId = Number(req.query.userid);
	var ingot = Number(req.query.ingot);
	var gold = Number(req.query.gold);
	var conf = req.query.conf;
	var ip = req.query.ip;
	var activitys = req.query.activitys;

	//参数合法性检测
	if (!userId || (!ingot && ingot != 0) || (!gold && gold != 0) || !conf) {
		http.send(res, error.ROOM_CREATE_ARGS_ERROR, "invalid parameters");
		return null;
	}
	//客户端传入的是字符串
	if (typeof conf == 'string') {
		conf = JSON.parse(conf);
	}

	if (!(global.type_check(conf.type_index) && global.rule_check(conf.rule_index))) {
		logger.warn("invalid rule or type index ");
		http.send(res, error.ROOM_CREATE_RULE_CHECK_ERROR);
		return null;
	}
	return {
		userId: userId,
		ingot: ingot,
		gold: gold,
		conf: conf,
		ip: ip,
		activitys: activitys
	}
}

exports.create_room_final_async = async function (req, res, data) {

	var userId = data.userId;
	var ingot = data.ingot;
	var gold = data.gold;
	var conf = data.conf;
	var ip = data.ip;
	var activitys = data.activitys;

	//规则检测完后检测钻石是否满足条件
	activitys = JSON.parse(activitys);
	var free = activity_global.check_activity(activitys, activity_global.ENTER_TYPE_FREE);
	var double = activity_global.check_activity(activitys, activity_global.DOUBLE_PLAY_TIME);
	var consume_ingot = global.get_ingot_value(conf.rule_index);
	if (!free) {
		//房卡游戏
		if (global.has_rule(conf.rule_index, global.MASK_INGOT_GAME)) {
			//lqzzb  房主代付
			if (process.ENV_CONFIG.ENV == "lqzzb") {
				if (!await money_service.check_user_items_async(userId, [
					{
						itemName: "钻石",
						count: global.get_ingot_value(conf.rule_index)
					}
				])) {
					// if (gold < global.get_ingot_value(conf.rule_index)) {
					logger.warn("lqzzb not gold to create Room");
					http.send(res, error.ROOM_CREATE_GOLD_NOT);
					return;
				}
			} else {
				if (!await money_service.check_user_items_async(userId, [
					{
						itemName: "房卡",
						count: global.get_ingot_value(conf.rule_index)
					}, {
						itemName: "VIP-1",
						count: 1
					}
				], false)) {
					// if (ingot < global.get_ingot_value(conf.rule_index)) {
					logger.warn("not ingot to create Room");
					http.send(res, error.ROOM_CREATE_INGOT_NOT);
					return;
				}
			}
		}

		//钻石游戏
		if (global.has_rule(conf.rule_index, global.MASK_GOLD_GAME)) {
			//lqzzb AA付款
			if (process.ENV_CONFIG.ENV == 'lqzzb') {
				if (!await money_service.check_user_items_async(userId, [
					{
						itemName: "钻石",
						count: global.get_ingot_value(conf.rule_index)
					}
				])) {
					// if (gold < global.get_ingot_value(conf.rule_index)) {
					logger.warn("lqzzb not gold to create Room");
					http.send(res, error.ROOM_CREATE_GOLD_NOT);
					return;
				}
			} else {
				if (!await money_service.check_user_items_async(userId, [
					{
						itemName: "钻石",
						count: global.get_ingot_value(conf.rule_index)
					}, {
						itemName: "VIP-1",
						count: 1
					}
				], false)) {
					// if (gold < global.get_ingot_value(conf.rule_index)) {
					logger.warn("not gold to create Room");
					http.send(res, error.ROOM_CREATE_GOLD_NOT);
					return;
				}
			}
		}
	} else {
		consume_ingot = 0;
	}

	var ip_info = get_ip_info(ip);

	logger.log("create room show me server info .................", gameServerInfo)

	roomMgr.createRoom(userId, conf, ingot, gameServerInfo.clientip, gameServerInfo.clientport, gameServerInfo.servertype, gameServerInfo.id, double, free, ip_info, function (errcode, roomId) {
		if (errcode != 0 || roomId == null) {
			http.send(res, errcode, "create failed.");
			return;
		}
		else {
			db.get_user_platchan(userId, null, function (platchan) {
				if (platchan) {
					log_manager.insert_create_room_log(userId, process.ENV_CONFIG.SERVER_TYPE, conf.type_index, conf.rule_index, roomId, platchan.platform, platchan.channel, ip_info, platchan.agent_id);
				} else {
					log_manager.insert_create_room_log(userId, process.ENV_CONFIG.SERVER_TYPE, conf.type_index, conf.rule_index, roomId, 'default', 'default', ip_info, 0);
				}
			})
			http.send(res, error.SUCCESS, "ok", { roomid: roomId, ingot_value: consume_ingot });
		}
	});
}

exports.eneter_room_async = async function (req, res) {
	show_request('/enter_room  ====>', JSON.stringify(req.query))
	var userId = Number(req.query.userid);
	var name = req.query.name;
	var ingot = Number(req.query.ingot);
	var gold = Number(req.query.gold);
	var headimg = req.query.headimg;
	var sex = req.query.sex;
	var roomId = req.query.roomid;
	var sign = req.query.sign;

	if (!userId || !roomId || (!ingot && ingot != 0) || (!gold && gold != 0)) {
		http.send(res, error.ROOM_ENTER_ARGS_ERROR, "invalid parameters");
		return;
	}
	var user_info = {
		userId: userId,
		name: name,
		ingot: ingot,
		gold: gold,
		headimg: headimg,
		sex: sex
	}
	//安排玩家坐下
	await roomMgr.enterRoom_async(roomId, user_info, function (ret) {
		if (ret != 0) {
			http.send(res, ret, 'enter room failed');
			return;
		}

		var token = tokenMgr.createToken(userId, 500000);
		logger.log("enter room success===================>")
		http.send(res, error.SUCCESS, "ok", { token: token });
	});
}

exports.is_room_running = function (req, res) {
	show_request('/is_room_running  ====>', JSON.stringify(req.query))
	var roomId = req.query.roomid;
	if (!roomId) {
		http.send(res, error.SYSTEM_ARGS_ERROR, "invalid parameters");
		return;
	}
	http.send(res, error.SUCCESS, "ok", { runing: true });
}

exports.web_find_room = function (req, res) {
	var room_id = req.query.room_id;

	var room = roomMgr.getRoom(room_id)

	if (room) {
		http.send(res, error.SUCCESS, 'ok.', { runing: true });
	} else {
		http.send(res, error.SUCCESS, 'ok.', { runing: false });
	}
}

exports.web_delete_room = function (req, res) {
	show_request('/web_delete_room  ====>', JSON.stringify(req.query))
	var room_id = req.query.room_id;
	var agent_id = req.query.agent_id;
	var room = roomMgr.getRoom(room_id);
	if (room) {
		if (!agent_id) {
			agent_id = -1;
		}
		if (room.gameMgr) {
			room.gameMgr.force_over_room(room_id);
		} else {
			roomMgr.destroy(roomId, agent_id);
			userMgr.kickAllInRoom(roomId);
		}
	}
	http.send(res, error.SUCCESS, { status: true });
}

exports.update = function () {
	if (lastTickTime + process.ENV_CONFIG.HTTP_TICK_TIME < Date.now()) {
		lastTickTime = Date.now();
		gameServerInfo.load = roomMgr.getTotalRooms();
		gameServerInfo.version = version;
		http.get(process.ENV_CONFIG.PRIVATE_IPS.HALL_IP, process.ENV_CONFIG.PRIVATE_PORTS.ROOM_PORT, "/register_gs", gameServerInfo, function (ret, data) {
			if (ret == true) {
				if (data.errcode != 0) {
					logger.error(data.errmsg);
				}

				if (data.ip != null) {
					serverIp = data.ip;
				}
			}
			else {
				//
				lastTickTime = 0;
			}
		});

		// var mem = process.memoryUsage();
		// var format = function(bytes) {  
		//       return (bytes/1024/1024).toFixed(2)+'MB';  
		// }; 
		//logger.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
	}
}


