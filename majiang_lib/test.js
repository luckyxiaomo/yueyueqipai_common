var api = require( './api.js' );
api.Init();
api.MTableMgr.LoadTable();

// var t = Date.now();
// var cards = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 32, 32, 32, 25 ];
// for(var i=0;i<10000000;++i){
//     api.MHulib.get_hu_info( cards, 25 );
// }

// console.log(Date.now() -t);

// var mem = process.memoryUsage();
// var format = function(bytes) {  
//       return (bytes/1024/1024).toFixed(2)+'MB';  
// }; 
// console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));