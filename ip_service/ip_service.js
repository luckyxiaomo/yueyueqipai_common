var ipdatabase = require('./ip')
var path = require('path')
var file_path = __dirname + '/17monipdb.dat'
ipdatabase.load(file_path)

var ip_reg =/^((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}$/

exports.find = function(ip,callback){
    if(ip_reg.test(ip)){
        ipdatabase.find(ip,callback);
    }else{
        callback(['','','',''])
    }
}

exports.find_sync = function(ip){
    if(ip_reg.test(ip)){
        return ipdatabase.findSync(ip);
    }else{
        return ['','','','']
    }
}