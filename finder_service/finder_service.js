/********************************************************************************
 * 1，导入模块变量全为const变量
 * 2, 其它非导入变量名，方法名，全部小写，间隔用下划线(尽量用英文)
 * 3, 常量全部大写，间隔用下划线
 * 4, 缩进全部Tab，4个空格
 * 5, 回调嵌套原则上不能超过3层
 * 6, 注释：统一用JSDoc注释
 * 7, 新建文件请用 ~/template/template.js模板
 *******************************************************************************/


/**
 * 
 * 网络发现服务
 * 功能：
 *      组件发现
 *      公用websocket端口
*/


/////////////////////////////////导入模块//////////////////////////////////////////
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const client = dgram.createSocket("udp4");
const ip_finder = require("../ip_service/ip_finder")
const logger = require("../log").logger;

///////////////////////////////导入模块结束////////////////////////////////////////

///////////////////////////////全局变量////////////////////////////////////////////

///////////////////////////////全局变量结束////////////////////////////////////////

////////////////////////////////////内部方法///////////////////////////////////////
/**
 * 计算广播地址
 * @param {*} ip 
 * @param {*} mask 
 */
function get_broad_cast_addr(ip, mask) {
    var ips = ip.split(".")
    var mks = mask.split(".")
    var addr = ""
    for (var i = 0; i < ips.length; ++i) {
        var sip = Number(ips[i])
        var smk = Number(mks[i])
        var r = (sip & smk) | (0xff ^ smk)
        if (i == (ips.length - 1)) {
            addr += r
        } else {
            addr += r + "."
        }
    }
    return addr
}
/**
 * 注册处理函数
 * @param {*} instance 
 * @param {*} msg_handler 
 */
function regist_handler(instance, msg_handler) {
    //listen state open
    instance.on("listening", () => {
        logger.info("Finder [%s ] listening........%s:%d", instance._type, instance._host, instance._port)
    });
    instance.on("close", () => {
        logger.warn("Finder [%s] Close!", instance._type)
    });
    instance.on("error", (err) => {
        logger.error("Finder [%s] Error: %s", instance._type, err);
    });
    instance.on("message", (msg, rinfo) => {
        // logger.info("Finder [%s] Msg:%s from %s:%d", instance._type, msg, rinfo.address, rinfo.port)
        var req = null;
        try {
            req = JSON.parse(msg);
        } catch (error) {
            logger.error("Try To Parse Msg Failed :",msg,rinfo);
            return;
        }
        msg_handler.dispatch_message(req,(code,data)=>{
            if(!data){
                return;
            }else{
                var res = data;
                res = JSON.stringify(res);
                instance.send(res,rinfo.port,rinfo.address);
            }
        });
    });
}
//////////////////////////////////内部方法结束//////////////////////////////////////

/////////////////////////////////////导出方法////////////////////////////////////////
/**
 * 服务端实例
 */
exports.SERVER_INSTANCE = server;
/**
 * 客户端实例
 */
exports.CLIENT_INSTANCE = client;
/**
 * 服务器组件
 * @param {*} port number 监听端口
 * @param {*} msg_handler Function 处理函数
 */
exports.finder_server = function (port, msg_handler) {
    server._host = ip_finder.LOCAL_IP;
    server._port = port;
    server._type = "Server";
    server._broadcast_port = get_broad_cast_addr(ip_finder.LOCAL_IP,ip_finder.MASK)
    server.bind(server._port, server._host);
    regist_handler(server, msg_handler);
}
/**
 * 客户端组件
 * @param {*} port number string
 * @param {*} msg_handler Function 处理函数
 */
exports.finder_client = function (port, msg_handler) {
    client._host = ip_finder.LOCAL_IP;
    client._port = port;
    client._type = "Client"
    client.bind(client._port, client._host);
    client._broadcast_port = get_broad_cast_addr(ip_finder.LOCAL_IP,ip_finder.MASK)
    regist_handler(client, msg_handler);
}
/**
 * 心跳
 * @param {*} time 
 * @param {*} tick_handler 
 */
exports.tick = function(time,tick_handler,args){
    setTimeout(tick_handler,time,args)
}
/**
 * 广播消息
 * @param {*} instance 
 * @param {*} port 
 * @param {*} msg 
 */
exports.broadcast = function(instance,port,msg){
    instance.setBroadcast(true);
    instance.setTTL(128);
    if(typeof msg == "object"){
        msg = JSON.stringify(msg)
    }
    instance.send(msg,port,instance._broadcast_port);
}
/**
 * 点对点消息
 * @param {*} instance 
 * @param {*} host 
 * @param {*} port 
 * @param {*} msg 
 */
exports.send_to = function(instance,host,port,msg){
    if(typeof msg == "object"){
        msg = JSON.stringify(msg);
    }
    instance.send(msg,port,host)
}
///////////////////////////////////导出方法结束//////////////////////////////////////