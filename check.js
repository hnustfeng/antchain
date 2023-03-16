let process = require('child_process');
let ChildProcess  = process.fork('./bin/www');
 
ChildProcess.on('exit',function (code) {
    console.log('process exits + '+code);
    if(code !== 0){
        console.log("重启中。。。");
        process.fork('./check.js');
    }
 
});