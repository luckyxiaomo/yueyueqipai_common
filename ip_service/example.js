var ipx = require("./ipx")

ipx.load("H:/datalib/ipip/ipip.datx")

console.log(ipx.findSync("118.28.8.8"))
console.log(ipx.findSync("218.28.13.98"))
