var log4js = require("log4js");
var log4js_config = require("../log.json");
log4js.configure(log4js_config);

exports.log4js = log4js;
