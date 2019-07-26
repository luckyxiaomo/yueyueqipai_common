var fs = require('fs')
var path = require('path')
var version_file = path.normalize(__dirname + './../VERSION');
//查看GC node --trace_gc --trace_gc_verbose link_service.js
var version = null;

function load_version() {
    // console.log(version_file)
    if (fs.existsSync(version_file)) {
        var b = fs.readFileSync(version_file)
        version = b.toString();
        console.log("LOAD SERVER VERSION----->", version)
    } else {
        console.error("VERSION file NOT FOUND.")
    }
    // if (process.ENV_CONFIG_ENV == 'dev') {
    //     require('./link_service')
    // }
}

load_version()

exports.version = version;