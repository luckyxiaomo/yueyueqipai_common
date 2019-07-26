var global = {};

//活动类型
global.ENTER_TYPE_FREE = 1; //免费入场
global.DOUBLE_PLAY_TIME = 2;//创建房间可以获得的局数加倍

//验证当前活动是否开启.
global.check_activity = function (activitys, activity_type) {
    for (var i = 0; i < activitys.length; i++) {
        if (activitys[i].activity_type == activity_type) {
            return true;
        }
    }
    return false;
}

exports.global = global;