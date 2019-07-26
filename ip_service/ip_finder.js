//获取本地IP
var os = require('os'),
iptable = {},
ifaces = Object.values(os.networkInterfaces());
if('linux' == os.platform()){
    for(var i=0;i<ifaces[1].length;++i){
        var d = ifaces[1][i];
        if(d.family == 'IPv4' && d.internal == false){
            iptable['local_ip'] = d.address
            iptable['mask'] = d.mask
            break;
        }
    }
}else if('win32' == os.platform()){
    for(var i=0;i<ifaces[0].length;++i){
        var d = ifaces[0][i];
        if(d.family == 'IPv4' && d.internal == false){
            iptable['local_ip'] = d.address
            iptable['mask'] = d.netmask
            break;
        }
    }
}

/**
 * 局域网IP
 */
exports.LOCAL_IP = iptable.local_ip;
/**
 * 局域网子网掩码
 */
exports.MASK = iptable.mask;