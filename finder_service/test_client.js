var finder_service = require("./finder_service")
var msg_handler = require("./msg_handler")
finder_service.finder_client(9001,msg_handler)
/**
 * 外部心跳注入函数
 * @param {*} args 
 */
function tick(args){
    var f = args[0];
    f.broadcast(f.CLIENT_INSTANCE,8086,{module:msg_handler.MODULES.INTERNAL,action:msg_handler.ACTIONS.TICK,response:true,data:[1,2,3,4,5,6,76,87]})
    setTimeout(tick,3000,args)
}

finder_service.tick(3000,tick,[finder_service])