/*
  refs: 
  http://www.quora.com/What-is-the-best-way-to-read-a-file-line-by-line-in-node-js
  http://blog.jaeckel.com/2010/03/i-tried-to-find-example-on-using-node.html
  
  iconv -f ISO-8859-1 -t UTF-8 TEST.txt >TEST.utf8.txt 
  
*/
/* Http Variables */

var fs = require('fs');
var path = require('path');
var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');
var http = require('http');

/*
1016         BEAUMIER             CLAUDE           *                 7.00  16.00                    12.00  21.00     8.00  17.00     7.00  16.00     7.00  16.00                      40.00            
*/

function toMinutes(hdotm){
    var hm=hdotm.split('.');
    return 60*hm[0]+1*hm[1]
}
function dayEntry(pair){
    pairRE=/(\d{1,3}\.\d\d)\s+(\d{1,3}\.\d\d)/g;
    var m =  pairRE.exec(pair);
    if (m){
        //console.log(m);
        return {debut:m[1],fin:m[2],dur:toMinutes(m[2])-toMinutes(m[1])};
    } else return {dur:0};
}
function parseTimeSheet(){
    var sheet={
        produced:'Date inconnue',
        entries:[]
    };
    var allText = fs.readFileSync(path.join(__dirname, 'TEST.utf8.txt'), 'utf8'); //.toString()
    var lines = allText.split('\n');
    var dataRE = /(\d[\d\s]{12})([A-Z][\w\s]{20})([A-Z][\w\s]{13})([\*\s]{19})([\d\.\s]{13})\s{3}([\d\.\s]{13})\s{3}([\d\.\s]{13})\s{3}([\d\.\s]{13})\s{3}([\d\.\s]{13})\s{3}([\d\.\s]{13})\s{3}([\d\.\s]{13})\s{1}([\d\.\s]{10})/;
    var stampRE = /Date de production.*(\d\d\/\d\d\/\d\d\d\d)/;
    lines.forEach(function (line) {
        var m =  dataRE.exec(line);
        if (m){
            //console.log(m);
            var rec = {
                no: m[1],
                last: m[2],
                first: m[3],
                //star: m[4],
                jours:[
                  dayEntry(m[5]),
                  dayEntry(m[6]),
                  dayEntry(m[7]),
                  dayEntry(m[8]),
                  dayEntry(m[9]),
                  dayEntry(m[10]),
                  dayEntry(m[11]),
                ],
                total: m[12],
                totalMinutes:toMinutes(m[12]),
                totalCalc:0,
                inputLine:line
            }
            rec.jours.forEach(function (entry) {
                rec.totalCalc+=entry.dur;
            });
            //console.log(rec);
            sheet.entries.push(rec);
            //res.write(line+'\n');
        }
        if (stampRE.test(line)){
            //console.log(stampRE.exec(line));
            sheet.produced=stampRE.exec(line)[1];
        }
    });
    return sheet;
}

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var sheet = parseTimeSheet();
    res.write(JSON.stringify(sheet,null,4));
    res.end('\n');
}).listen(port, host);
console.log('open http://'+host+':'+port);

parseTimeSheet();
console.log('http://'+host+':'+port+'/');
