var daily_task_service = require('./daily_task_service');
var moment = require('moment');

// daily_task_service.init_daily_tasks();
// daily_task_service.init_week_tasks();

console.log(moment("2017-10-28").isoWeek());
console.log(moment("2017-10-29").isoWeek());
console.log("=======================================================================");
console.log(moment("2017-10-30").isoWeek());
console.log(moment("2017-10-31").isoWeek());
console.log(moment("2017-11-01").isoWeek());
console.log(moment("2017-11-02").isoWeek());
console.log(moment("2017-11-03").isoWeek());
console.log(moment("2017-11-04").isoWeek());
console.log(moment("2017-11-05").isoWeek());
console.log("=======================================================================");
console.log(moment("2017-11-06").isoWeek());
console.log(moment("2017-11-07").isoWeek());
console.log("=======================================================================");


console.log(moment("2017-01-01").isoWeek());
console.log(moment("2017-01-02").isoWeek());
console.log(moment("2017-01-03").isoWeek());
console.log(moment("2017-01-04").isoWeek());
console.log("=======================================================================");
console.log(moment("2017-12-29").isoWeek());
console.log(moment("2017-12-30").isoWeek());
console.log(moment("2017-12-31").isoWeek());
console.log(moment("2018-01-01").isoWeek());
console.log(moment("2018-01-02").isoWeek());
console.log(moment("2018-01-03").isoWeek());
console.log("=======================================================================");
console.log(moment("2018-12-29").isoWeek());
console.log(moment("2018-12-30").isoWeek());
console.log(moment("2018-12-31").isoWeek());
console.log(moment("2019-01-01").isoWeek());
console.log(moment("2019-01-02").isoWeek());
console.log(moment("2019-01-03").isoWeek());
console.log(moment("2019-01-04").isoWeek());
console.log(moment("2019-01-05").isoWeek());


console.log(moment('2019-01-01').diff(moment('2018-01-01'), 'days'));


console.log(moment(1510020350 * 1000).format("YYYY-MM-DD HH:mm:ss"));
console.log(moment(moment().unix() * 1000).format("YYYY-MM-DD HH:mm:ss"));

console.log(daily_task_service.global_setting.is_same_day(moment().unix(), 1510020350));
console.log(daily_task_service.global_setting.is_same_week(moment().unix(), 1510020350));
