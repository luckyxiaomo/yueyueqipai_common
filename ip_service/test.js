var ip = require('./ip')

ip.load('./17monipdb.dat')

var ipd = '0.0.0.0';
var rgs =/^((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}$/
if(rgs.test(ipd)){
    var data = ip.findSync(ipd)
    
    console.log(data)
}else{
    console.log('invalied ip.')
}

var ip_finder = require("./ip_finder")


console.log(ip_finder.LOCAL_IP)
console.log(ip_finder.MASK)