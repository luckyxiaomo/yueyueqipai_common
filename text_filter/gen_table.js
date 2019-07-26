var xlsx = require('node-xlsx')
var path = require('path')
var fs = require('fs')
var file_path = path.resolve(__filename+'./../chatWord.xls')
var datas = xlsx.parse(file_path)

var file_name = 'keywords'

var chat_word =[];

for(var i=0;i<datas.length;++i){
    var obj = datas[i];
    if(obj.name == 'chatWords'){
        for(var j=1;j<obj.data.length;++j){
            var oo = obj.data[j];
            if(chat_word.indexOf(oo[0]) == -1){
                chat_word.push(oo[0]);
            }
        }
    }
}


function write_to_file(data,file){
    var fwriter = fs.createWriteStream(__dirname + '/' + file)
    for(var i=0;i<data.length;++i){
        fwriter.write(String(data[i]))
        fwriter.write('\n')
    }
    fwriter.end();
}

write_to_file(chat_word,file_name)