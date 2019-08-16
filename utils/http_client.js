const path = require("path");
const log4js = require('./log').log4js;
const logger = log4js.getLogger(path.basename(__filename));

///////////////////////////////////////////////////////
/**
 * http 客户端服务
 */

const http = require('http');
const https = require('https');
const qs = require('querystring');


String.prototype.format = function (args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if (args[key] != undefined) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
                    var reg = new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

exports.post = function (host, port, path, data, callback, safe) {

    var content = qs.stringify(data);
    var options = {
        host: host,
        port: port,
        path: path,
        method: 'POST',
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": content.length
        }
    };

    var req_pro = http;
    if (safe) {
        req_pro = https;
    }

    var req = req_pro.request(options, function (res) {
        // logger.log('STATUS: ' + res.statusCode);  
        // logger.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //logger.log('BODY: ' + chunk);
            callback(chunk);
        });
    });

    req.on('error', function (e) {
        logger.error('problem with request: ' + e.message);
    });
    req.write(content);
    req.end();
};

exports.post2 = function (host, path, data, callback, safe) {
    // var content = qs.stringify(data);
    var content = data
    var options = {
        host: host,
        path: path,
        port: 443,
        data: content,
        method: 'POST',
        headers: {
            "Content-Type": 'text/xml;charset=utf8',
            "Content-Length": Buffer.byteLength(content)
        }
    };

    // logger.log(options)

    var req_pro = http;
    if (safe) {
        req_pro = https;
    }

    var req = req_pro.request(options, function (res) {
        // logger.log('STATUS: ' + res.statusCode);  
        // logger.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            // logger.log('BODY: ' + chunk)
            callback(chunk);
        });
    });

    req.on('error', function (e) {
        logger.error('problem with request: ' + e.message);
    });
    req.write(content);
    req.end();
};

exports.get2 = function (url, data, callback, safe) {
    var content = qs.stringify(data);
    var url = url + '?' + content;
    var proto = http;
    if (safe) {
        proto = https;
    }
    var req = proto.get(url, function (res) {
        //logger.log('STATUS: ' + res.statusCode);  
        //logger.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //logger.log('BODY: ' + chunk);
            var json = JSON.parse(chunk);
            callback(true, json);
        });
    });

    req.on('error', function (e) {
        logger.error('problem with request: ' + e.message);
        callback(false, e);
    });

    req.end();
};

exports.get = function (host, port, path, data, callback, safe) {
    if (typeof callback != "function") {
        callback = function (a, b, c, d, e, f) { }
    }
    var content = qs.stringify(data);
    var options = {
        hostname: host,
        path: path + '?' + content,
        method: 'GET'
    };
    if (port) {
        options.port = port;
    }
    var proto = http;
    if (safe) {
        proto = https;
    }
    var req = proto.request(options, function (res) {
        //logger.log('STATUS: ' + res.statusCode);  
        //logger.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //logger.log('BODY: ' + chunk);
            try {
                var json = chunk;
                if (typeof json == "string") {
                    json = JSON.parse(json);
                }
                callback(true, json);
            } catch (err) {
                logger.error("HTTP PARSE JSON ERROR:", err.stack);
                callback(false, null)
            }
        });
    });

    req.on('error', function (e) {
        logger.error("problem with request " + path + ":" + e.message);
        callback(false, e);
    });

    req.end();
};

exports.send = function (res, errcode, errmsg, data) {
    if (data == null) {
        data = {};
    }
    data.errcode = errcode;
    data.errmsg = errmsg;
    var jsonstr = JSON.stringify(data);
    res.send(jsonstr);
};

exports.identify_get = function (data, callback) {
    var content = qs.stringify(data);
    var options = {
        "method": "GET",
        "hostname": "v.apix.cn",
        "port": null,
        "path": "/apixcredit/idcheck/mobile?" + content,
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "apix-key": "d6a1e0e4e1d641d152bc30e6ab87322c"
        }
    };

    // logger.log(options)

    var req = https.request(options, function (res) {
        //logger.log('STATUS: ' + res.statusCode);  
        //logger.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //logger.log('BODY: ' + chunk);
            try {
                var json = JSON.parse(chunk);
                callback(true, json);
            } catch (err) {
                logger.error("HTTP PARSE JSON ERROR:", err.stack);
                callback(false, null)
            }
        });
    });

    req.on('error', function (e) {
        logger.error('problem with request: ' + e.message);
        callback(false, e);
    });

    req.end();
}