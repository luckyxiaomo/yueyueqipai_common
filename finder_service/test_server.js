var finder_service = require("./finder_service")
var msg_handler = require("./msg_handler")
finder_service.finder_server(8086,msg_handler)
