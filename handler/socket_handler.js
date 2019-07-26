/**
 * 通用socket handlers
 */
var db = require('../database');
var crypto = require('../crypto');
const error = require('../error').error;
const text_filter = require('../text_filter/text_filter');
const logger = require("../log").logger;

var tokenMgr = null;
var roomMgr = null;
var userMgr = null;
var global = null;
var msgtemplete = null;

/**
 * 注册消息.
 */
exports.register_handler = function (socket) {
    //登录
    socket.on('login', function (data) {
        show_request('login', data);
        data = JSON.parse(data);
        if (socket.userId != null) {
            //已经登陆过的就忽略
            return;
        }
        var token = data.token;
        var roomId = data.roomid;
        var time = data.time;

        //检查参数合法性
        if (token == null || roomId == null || time == null) {
            logger.warn("login_result, errcode = %d msg= %s", 1, "invalid parameters");
            socket.emit('login_result', { errcode: 1, errmsg: "invalid parameters" });
            return;
        }

        //检查token是否有效
        if (tokenMgr.isTokenValid(token) == false) {
            logger.warn("login_result, errcode = %d msg= %s", 3, "token out of time.");
            socket.emit('login_result', { errcode: 3, errmsg: "token out of time." });
            return;
        }

        //检查房间合法性
        var userId = tokenMgr.getUserID(token);
        var roomId = roomMgr.getUserRoom(userId);
        userMgr.load_user_info(userId, function (result) {
            if (!result) {
                logger.warn("login_result, errcode = %d msg= %s", 4, "read data failed.");
                socket.emit('login_result', { errcode: 4, errmsg: "read data failed." });
                return;
            }
        });
        userMgr.bind(userId, socket);
        socket.userId = userId;

        //返回房间信息
        var roomInfo = roomMgr.getRoom(roomId);

        if (!roomInfo) {
            logger.warn("Try to login room is None.")
            socket.emit('login_result', { errcode: error.ROOM_ENTER_NOT_FOUND, errmsg: "room not found." })
            return;
        }

        var seat_info = null;
        for(var i=0;i<roomInfo.seats.length;++i){
            var tmp_s = roomInfo.seats[i];
            if(tmp_s && tmp_s.user_id == userId){
                seat_info = tmp_s;
                break;
            }
        }

        if(!seat_info){
            for(var i=0;i<roomInfo.watch_seats.length;++i){
                var tmp = roomInfo.watch_seats[i];
                if(tmp && tmp.user_id == userId){
                    seat_info = roomInfo.watch_seats[i];
                    break;
                }
            }
        }

        if(!seat_info){
            logger.error("login game seat info is None:",userId,JSON.stringify(roomInfo));
        }else{
            seat_info.ip = socket.handshake.address;
        }

        var userData = null;
        var seats = [];
        var watch_seats =[];
        var is_watch = false;
        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var rs = roomInfo.seats[i];
            if(rs && rs.user_id >0){
                var online = false;
                if (rs.user_id > 0) {
                    online = userMgr.isOnline(rs.user_id);
                }
                var udd = {
                    userid: rs.user_id,
                    ip: rs.ip,
                    score: rs.score,
                    name: rs.name,
                    headimg: rs.imgurl,
                    sex: rs.sex,
                    online: online,
                    ready: rs.ready,
                    seatindex: i,
                    holds: rs.holds,
                    folds: rs.folds,
                    watch: rs.watch,
                    gps: rs.gps ? rs.gps : '0,0',
                }
                seats.push(udd);
                if (userId == rs.user_id) {
                    userData = udd;
                }
            }
        }
        if(roomInfo.watch_seats){
            for(var i=0;i< roomInfo.watch_seats.length;++i){
                var rs = roomInfo.watch_seats[i];
                if(rs && rs.user_id >0){
                    var online = userMgr.isOnline(rs.user_id);
                    var udd = {
                        userid: rs.user_id,
                        ip: rs.ip,
                        score: rs.score,
                        name: rs.name,
                        headimg: rs.imgurl,
                        sex: rs.sex,
                        online: online,
                        ready: rs.ready,
                        seatindex: i,
                        holds: [],
                        folds: [],
                        watch: rs.watch,
                        join:rs.join,
                        gps: rs.gps ? rs.gps : '0,0',
                    }
                    seats.push(udd);
                    if(userId == rs.user_id){
                        is_watch = true;
                        userData = udd;
                    }
                }
            }
        }

        //通知前端
        var ret = {
            errcode: 0,
            errmsg: "ok",
            data: {
                roomid: roomInfo.id,
                conf: roomInfo.conf,
                num_of_games: roomInfo.num_of_games,
                seats: seats,
                agent_user_id: roomInfo.agent_user_id,
            }
        };

        logger.debug("login result ==>", JSON.stringify(ret));

        socket.emit('login_result', ret);
        if(is_watch){
            socket.emit("new_watcher_comes_push",userData);
        }else{
            //通知其它客户端
            userMgr.broacastInRoom('new_user_comes_push', userData, userId);
        }

        socket.gameMgr = roomInfo.gameMgr;

        //玩家上线，强制设置为TRUE
        //只有游戏开始的时候才需要强制设置为true
        var game = roomInfo.gameMgr.get_game_by_user(userId);
        if (game && game.state != global.GAME_STATE_FREE) {
            logger.debug("login check  game state ==%d", game.state)
            socket.gameMgr.set_ready(userId, true);
        }

        socket.emit('login_finished');

        //如果有解散信息发出解散信息
        if (roomInfo.dissmiss && !is_watch) {
            var ramaingTime = (roomInfo.dissmiss.endTime - Date.now()) / 1000;
            var dis_info = {
                mask: roomInfo.dissmiss.chose_index,
                time: ramaingTime,
                states: roomInfo.dissmiss.states
            }
            userMgr.sendMsg(userId, 'dissolve_notice_push', dis_info);
        }
    });

    //准备
    socket.on('ready', function (data) {
        show_request('ready', data);
        var userId = socket.userId;
        if (userId == null) {
            return;
        }
        socket.gameMgr.set_ready(userId, true);
        userMgr.broacastInRoom('user_ready_push', { userid: userId, ready: true }, userId, true);
    });

    //获取定位
    socket.on('gps', function (data) {
        show_request('gps', data);
        var user_id = socket.userId;
        data = JSON.parse(data)
        if (!user_id) {
            return;
        }
        if (!data.gps) {
            return;
        }
        var roomId = roomMgr.getUserRoom(user_id);
        if (!roomId) {
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        if (!roomInfo) {
            return;
        }
        var seatIndex = roomMgr.getUserSeat(user_id);
        //新增观众席
        var seat_info = roomInfo.seats[seatIndex];
        if (!seat_info) {
            for (var i = 0; i < roomInfo.watch_seats.length; ++i) {
                var tmp = roomInfo.watch_seats[i];
                if (tmp && tmp.user_id == user_id) {
                    seat_info = roomInfo.watch_seats[i];
                    break;
                }
            }
        }
        seat_info.gps = data.gps;
        // logger.log("after set gps---->",seat_info)
        userMgr.broacastInRoom('gps', { user_id: user_id, gps: data.gps }, user_id, true);
    });

    //主动开始游戏
    socket.on('start_play',function(data){
        var user_id = socket.userId;
        if(user_id == null) return;

        socket.gameMgr.start_play(user_id);

    });

    //开始提示
    socket.on('start_play_choice',function(data){
        var user_id = socket.userId;
        if(user_id == null) return;
        socket.gameMgr.start_play_choice(user_id,data);
    });

    //聊天
    socket.on('chat', function (data) {
        if (socket.userId == null) {
            return;
        }
        var userId = socket.userId;
        var roomId = roomMgr.getUserRoom(userId);
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserSeat(userId);
        var seat_info = roomInfo.seats[seatIndex]
        if (seat_info.user_id == socket.userId) {
            var chatContent = data;
            //for test
            if (process.ENV_CONFIG.ENV== "dev" || process.ENV_CONFIG.ENV == "test") {
                if (chatContent.indexOf("/") != -1) {
                    chatContent = chatContent.replace('/', '');
                    var ar = chatContent.split(' ');
                    gm_command(socket, ar);
                    return;
                }
            }
            chatContent = JSON.stringify(chatContent);
            while(chatContent.indexOf("\\") != -1){
                chatContent = chatContent.replace("\\\\","*")
            }
            //test end
            text_filter.filter(chatContent, function (err, rep) {
                if (err) {
                    logger.error("text filter failed ===>".chatContent);
                    userMgr.broacastInRoom('chat_push', { sender: socket.userId, content: chatContent }, socket.userId, true);
                } else {
                    userMgr.broacastInRoom('chat_push', { sender: socket.userId, content: rep }, socket.userId, true);
                }
            })
        }
    });

    //快速聊天
    socket.on('quick_chat', function (data) {
        if (socket.userId == null) {
            return;
        }
        var userId = socket.userId;
        var roomId = roomMgr.getUserRoom(userId);
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserSeat(userId);
        var seat_info = roomInfo.seats[seatIndex]
        if (seat_info.user_id == socket.userId) {
            var chatId = data;
            userMgr.broacastInRoom('quick_chat_push', { sender: socket.userId, content: chatId }, socket.userId, true);
        }
    });

    //语音聊天
    socket.on('voice_msg', function (data) {
        if (socket.userId == null) {
            return;
        }
        var userId = socket.userId;
        var roomId = roomMgr.getUserRoom(userId);
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserSeat(userId);
        var seat_info = roomInfo.seats[seatIndex]
        if (seat_info.user_id == userId) {
            userMgr.broacastInRoom('voice_msg_push', { sender: socket.userId, content: data }, socket.userId, true);
        }
    });

    //表情
    socket.on('emoji', function (data) {
        if (socket.userId == null) {
            return;
        }
        var userId = socket.userId;
        var roomId = roomMgr.getUserRoom(userId);
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserSeat(userId);
        var seat_info = roomInfo.seats[seatIndex]
        if (seat_info.user_id == socket.userId) {
            var phizId = data;
            userMgr.broacastInRoom('emoji_push', { sender: socket.userId, content: phizId }, socket.userId, true);
        }
    });

    //新增表情协议
    socket.on('emoji_to', function (data) {
        logger.log('data 数据:', data)
        if (socket.userId == null) {
            return;
        }
        if (typeof data == 'string') {
            data = JSON.parse(data);
        }
        var target_userid = data.target;
        var content = data.content;

        if (target_userid == socket.userId) {
            return;
        }
        var reg = /^[a-z]+$/

        if (!reg.test(content)) {
            return;
        }
        if (target_userid != 0) {
            var userId = socket.userId;
            var roomId = roomMgr.getUserRoom(userId);
            var roomInfo = roomMgr.getRoom(roomId);
            var seatIndex = roomMgr.getUserSeat(userId);
            var seat_info = roomInfo.seats[seatIndex]
            var find = false;
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i]
                if (s && s.user_id > 0) {
                    if (s.user_id == target_userid) {
                        find = true;
                        break;
                    }
                }
            }
            if (find) {
                userMgr.broacastInRoom('emoji_to_cl', { sender: socket.userId, target: target_userid, content: content }, socket.userId, true);
            }
        }
    });

    //退出房间仅限于非房主 游戏未开始
    socket.on('exit', function (data) {
        show_request('exit', data);
        var userId = socket.userId;
        if (userId == null) {
            return;
        }
        var roomId = roomMgr.getUserRoom(userId);
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserSeat(userId);
        var seat_info = roomInfo.seats[seatIndex]
        if (seat_info && seat_info.user_id == socket.userId) {
            if (roomId == null) {
                return;
            }

            var room = roomMgr.getRoom(roomId);
            if (room == null) return;
            if (room.num_of_games != 0) {
                return;
            }

            //如果是房主，则只能走解散房间
            if (!room.agent_user_id && !room.conf.unionid && roomMgr.isCreator(roomId,userId)) {
                return;
            }

            //通知其它玩家，有人退出了房间
            userMgr.broacastInRoom('exit_notify_push', userId, userId, false);

            roomMgr.exitRoom(userId);
            userMgr.del(userId);

            socket.emit('exit_result');
            socket.disconnect();
        } else {
            //非正常玩家，直接退出
            userMgr.broacastInRoom('exit_notify_push', userId, userId, false);
            roomMgr.exitRoom(userId);
            userMgr.del(userId);
            socket.emit('exit_result');
            socket.disconnect();
        }
    });

    //解散房间 仅限于房主
    socket.on('dispress', function (data) {
        show_request('dispress', data);
        var userId = socket.userId;
        if (userId == null) {
            return;
        }

        var roomId = roomMgr.getUserRoom(userId);
        if (roomId == null) {
            return;
        }

        var room = roomMgr.getRoom(roomId);
        if (room == null) return;
        if (room.num_of_games != 0) {
            return;
        }

        // //如果游戏已经开始，则不可以
        // if(socket.gameMgr.has_began(roomId)){
        // 	return;
        // }
        logger.debug('check is room creator .....');
        //如果不是房主，则不能解散房间
        if (room.agent_user_id || room.conf.unionid || !roomMgr.isCreator(roomId,userId)) {
            return;
        }

        logger.debug('check all kick all.........');

        userMgr.broacastInRoom('dispress_push', {}, userId, true);
        userMgr.kickAllInRoom(roomId);
        roomMgr.destroy(roomId, global.ROOM_ACHIVE_DIS);
        socket.disconnect();
    });

    //申请解散房间
    socket.on('dissolve_request', function (data) {
        show_request('dissolve_request', data);
        var userId = socket.userId;
        if (userId == null) {
            return;
        }

        var roomId = roomMgr.getUserRoom(userId);
        if (roomId == null) {
            logger.warn("dissolve_request roomid ==null.")
            return;
        }

        var room = roomMgr.getRoom(roomId);
        if (room == null) return;
        if (room.num_of_games == 0) {
            return;
        }

        // //如果游戏未开始，则不可以
        // if(socket.gameMgr.has_began(roomId) == false){
        // 	logger.warn("dissolve_request game not begin.")
        // 	return;
        // }

        var ret = socket.gameMgr.apply_dissmiss(roomId, userId);
        //logger.warn("dissolve_request ret.",ret)
        if (ret != null) {
            var dissmiss = ret.dissmiss;
            var ramaingTime = (dissmiss.endTime - Date.now()) / 1000;
            var data = {
                mask: dissmiss.chose_index,
                time: ramaingTime,
                states: dissmiss.states
            }
            userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
        }
    });

    //统一解散房间
    socket.on('dissolve_agree', function (data) {
        var userId = socket.userId;

        if (userId == null) {
            return;
        }

        var roomId = roomMgr.getUserRoom(userId);
        if (roomId == null) {
            return;
        }

        var ret = socket.gameMgr.dissolve_operation(roomId, userId, true);
        if (ret != null) {
            var dissmiss = ret.dissmiss;
            var ramaingTime = (dissmiss.endTime - Date.now()) / 1000;
            var data = {
                mask: dissmiss.chose_index,
                time: ramaingTime,
                states: dissmiss.states
            }
            userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);

            var all_agree = true;
            for (var i = 0; i < dissmiss.states.length; ++i) {
                if (dissmiss.states[i] == false) {
                    all_agree = false;
                    break;
                }
            }

            if (all_agree) {
                socket.gameMgr.force_over_room(roomId);
            }
        }
    });

    //拒绝解散房间
    socket.on('dissolve_reject', function (data) {
        var userId = socket.userId;

        if (userId == null) {
            return;
        }

        var roomId = roomMgr.getUserRoom(userId);
        if (roomId == null) {
            return;
        }

        var ret = socket.gameMgr.dissolve_operation(roomId, userId, false);
        if (ret != null) {
            userMgr.broacastInRoom('dissolve_cancel_push', {}, userId, true);
        }
    });

    //断开链接
    socket.on('disconnect', function (data) {
        var userId = socket.userId;
        if (!userId) {
            return;
        }

        var now_socket = userMgr.get(userId)
        if (now_socket) {
            if (socket.id != now_socket.id) {
                socket.disconnect();
                return;
            }
        }

        var data = {
            userid: userId,
            online: false
        };

        //清除玩家的在线信息
        userMgr.del(userId);

        var roomid = roomMgr.getUserRoom(userId);
        if (roomid) {
            var room = roomMgr.getRoom(roomid);
            if (room) {
                var all_off = true;
                for (var i = 0; i < room.seats.length; ++i) {
                    var s = room.seats[i];
                    if (s && s.user_id > 0) {
                        if (userMgr.isOnline(s.user_id)) {
                            all_off = true;
                            break;
                        }
                    }
                }

                if (all_off) {
                    db.update_room_status(room.uuid, null, 0);
                }
            }
        }

        //通知房间内其它玩家
        userMgr.broacastInRoom('user_state_push', data, userId);

        //清除准备状态
        if (socket.gameMgr) {
            socket.gameMgr.set_ready(userId, false);
        }

        socket.userId = null;
        socket.disconnect();
    });

    //心跳
    socket.on('game_ping', function (data) {
        var userId = socket.userId;
        if (!userId) {
            return;
        }
        //logger.log('game_ping');
        socket.emit('game_pong');
    });

    //转让房主
    //只有房主能操作
    //只能在游戏空闲的时候可以踢出
    //transfer的也是userid
    // socket.on('transfer',function(data){
    // 	show_request('transfer',data);
    // 	if(socket.userId == null){ 
    // 		return;
    // 	}
    // 	var user_id = socket.userId;
    // 	var roomId = roomMgr.getUserRoom(user_id);
    // 	if(!roomId){
    // 		return;
    // 	}
    // 	if(!roomMgr.isCreator(roomId,user_id)){
    // 		return;
    // 	}
    // 	var room = roomMgr.getRoom(roomId);
    // 	if(!room){
    // 		return;
    // 	}
    // 	if(room.num_of_games !=0){
    // 		return;
    // 	}
    // 	data = JSON.parse(data);
    // 	var target = data.target;
    // 	if(!target){
    // 		return;
    // 	}
    // 	if(target == user_id){
    // 		return;
    // 	}
    // 	var target_roomId = roomMgr.getUserRoom(target)
    // 	if(target_roomId != roomId){
    // 		return;
    // 	}
    // 	var src_location = roomMgr.getUserLocation(user_id);
    // 	var tgt_location = roomMgr.getUserLocation(target);
    // 	var src_seat_index = roomMgr.getUserSeat(user_id);
    // 	var tgt_seat_index = roomMgr.getUserSeat(target);
    // 	var src_seat = room.seats[src_seat_index];
    // 	var tgt_seat = room.seats[tgt_seat_index];

    // 	//判断目标玩家是否满足房卡或钻石消耗.
    // 	db.get_user_data_by_userid(tgt_seat.user_id, function(ret){
    // 		if(!ret) {
    // 			return;
    // 		}
    // 		var ingot = ret.gems;
    // 		var gold = ret.coins;
    // 		if(!(room.conf.free) && !(room.conf.agent)){
    // 			//房卡游戏
    // 			if(global.has_rule(room.conf.rule_index,global.MASK_INGOT_GAME)){
    // 				if(ingot < global.get_ingot_value(room.conf.rule_index)){
    // 					return;
    // 				}
    // 			}
    // 			//金币游戏
    // 			if(global.has_rule(room.conf.rule_index,global.MASK_GOLD_GAME)){
    // 				if(gold < global.get_ingot_value(room.conf.rule_index)){
    // 					return;
    // 				}
    // 			}
    // 		}

    // 		//开始更换.
    // 		//1.将座位信息互换.
    // 		room.seats[src_seat_index] = tgt_seat;
    // 		room.seats[tgt_seat_index] = src_seat;
    // 		//2.将座位信息中位置索引互换.
    // 		src_seat.seat_index = tgt_seat_index;
    // 		tgt_seat.seat_index = src_seat_index;
    // 		//3.将location中位置索引互换.
    // 		src_location.seatIndex = tgt_seat_index;
    // 		tgt_location.seatIndex = src_seat_index;
    // 		//4.将房间的创建者改为目标玩家.
    // 		room.conf.creator = target;
    // 		//5.更新房间信息.
    // 		roomMgr.transfer_update(roomId);
    // 		//6.推送给客服端.
    // 		var msg = JSON.parse(msgtemplete.SC_Transfer);
    // 		var length = room.seats.length;
    // 		for(var i=0; i<length; ++i){
    // 			var seat = room.seats[i];
    // 			if(!seat){
    // 				continue;
    // 			}
    // 			msg.new_seat.push(seat.user_id);
    // 		}
    // 		userMgr.send_to_room("transfer", msg, room.id);
    // 	});
    // });

    //踢出房间
    //只有房主能操作
    //只能在游戏空闲的时候可以踢出
    //踢出的人的userid
    socket.on('kick', function (data) {
        show_request('kick', data);
        if (socket.userId == null) {
            return;
        }
        var user_id = socket.userId;
        var roomId = roomMgr.getUserRoom(user_id);
        if (!roomId) {
            return;
        }
        if (!roomMgr.isCreator(roomId, user_id)) {
            return;
        }
        var room = roomMgr.getRoom(roomId);
        if (!room) {
            return;
        }
        if (room.num_of_games != 0) {
            return;
        }
        data = JSON.parse(data);
        var target = data.target;
        if (!target) {
            return;
        }
        if (target == user_id) {
            return;
        }
        var target_roomId = roomMgr.getUserRoom(target)
        if (target_roomId != roomId) {
            return;
        }
        var tgt_location = roomMgr.getUserLocation(target);
        var tgt_seat_index = roomMgr.getUserSeat(target);
        var tgt_seat = room.seats[tgt_seat_index];
        if (!tgt_seat) {
            return;
        }
        //1.踢掉目标玩家
        var msg = JSON.parse(msgtemplete.SC_Kick);
        msg.kicked = target;
        userMgr.sendMsg(target, 'kick', msg);
        userMgr.kickUserInRoom(roomId, target);
        //2.将座位信息顺移.
        var length = room.seats.length;
        var temp_seats = [];
        for (var i = 0; i < length; ++i) {
            if (i != tgt_seat_index) {
                var temp_seat = room.seats[i];
                if (temp_seat && temp_seat.user_id > 0) {
                    temp_seats.push(temp_seat);
                }
            }
        }
        room.seats = temp_seats;
        //3.将新的座位信息的座位索引和Location中的座位索引进行更新.
        length = room.seats.length;
        for (var i = 0; i < length; ++i) {
            var temp_seat = room.seats[i];
            if (temp_seat && temp_seat.user_id > 0) {
                temp_seat.seat_index = i;
                var location = roomMgr.getUserLocation(temp_seat.user_id);
                location.seatIndex = i;
            }
        }
        //4.删除目标玩家Location中数据
        roomMgr.kick_user(target);
        //5.更新房间信息.
        roomMgr.update_room_seat_info(roomId);
        //6.推送给客服端.
        msg = JSON.parse(msgtemplete.SC_Kick);
        msg.kicked = target;
        var length = room.seats.length;
        for (var i = 0; i < length; ++i) {
            var seat = room.seats[i];
            if (!seat) {
                continue;
            }
            msg.new_seat.push(seat.user_id);
        }
        userMgr.send_to_room("kick", msg, room.id);
    });

    //删除房间
    socket.on('delete', function (data) {
        if (process.ENV_CONFIG.ENV == "dev") {
            var roomId = roomMgr.getUserRoom(socket.userId);
            logger.warn("GM delete Room.", roomId);
            if (socket.gameMgr) {
                socket.gameMgr.force_over_room(roomId);
            }
            return;
        }
    });
}

/**
 * 初始化
 */
exports.init = function (token_manager, room_manager, user_manager, global_setting, msg_templete) {
    tokenMgr = token_manager;
    roomMgr = room_manager;
    userMgr = user_manager;
    global = global_setting;
    msgtemplete = msg_templete;
}

/**
 * 显示请求方法.
 */
function show_request(commond, args) {
    logger.debug('Socket[%s][%s]', commond, args);
}

/**
 * GM命令
 */
function gm_command(socket, commond) {
    logger.warn("GM commond ===========>", commond[0]);
    if (commond[0] == 'out_card') {
        socket.gameMgr.out_card(socket.userId, { out_card: commond[1] });
    }
    if (commond[0] == 'op') {
        socket.gameMgr.operate_card(socket.userId, { op_code: commond[1], op_card: commond[2] });
    }
    if (commond[0] == 'show') {
        socket.gameMgr.gm_show(socket.userId);
    }
    if (commond[0] == "pf"){
        socket.gameMgr.chose_extro_score(socket.userId,commond[1])
    }
}