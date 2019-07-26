var log4js = require('log4js');
var log4js_config = require('./log4js.json');
log4js.configure(log4js_config);
var logger= log4js.getLogger('common');
if(process.ENV_CONFIG && process.ENV_CONFIG.LOG_LEVEL){
    logger.level = process.ENV_CONFIG.LOG_LEVEL
}
exports.logger = logger;