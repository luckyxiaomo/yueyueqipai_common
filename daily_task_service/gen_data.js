var xlsx = require('node-xlsx');
var path = require('path');
var file_path = path.resolve(__filename+'./../daily_task.xlsx');
var datas = xlsx.parse(file_path);
var fs = require('fs');

var daily_task_maps = {};

//生成日常任务
gen_daily_task();
write_to_file(daily_task_maps, "daily_task");


//生成日常任务.
function gen_daily_task() {
    var daily_task_datas = get_data_by_key("daily_task");
    var keys = null;
    for(var i = 0; i < daily_task_datas.length; i++){
        if(i == 0) {
            keys = daily_task_datas[i];
        }
        if(i >= 2) {
            var daily_task = {};
            for(var j = 0; j < keys.length; j++) {
                daily_task[keys[j]] = daily_task_datas[i][j];
            }
            daily_task_maps[daily_task.id] = daily_task;
        }
    }
}

//根据表名获取表数据.
function get_data_by_key(xlsx_key){
    for(var i = 0; i < datas.length; i++) {
        if(datas[i].name == xlsx_key){
            return datas[i].data;
        }
    }
    return null;
}

//写入文件中.
function write_to_file(data,file){
    var fwriter = fs.createWriteStream(__dirname + '/data/' + file +'.js')
    fwriter.write('exports.'+file+' = ')
    fwriter.write(JSON.stringify(data,null,2))
    fwriter.end();
}

