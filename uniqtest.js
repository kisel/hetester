/** Node.js test server
 * checks if request url's are uniq
 */

var http = require('http');
var url  = require('url');
var net  = require('net');
var port = 6080;
var uniq_test = {}
var hits = 0;

function res_uniqtest (req, res) {
    ++hits;
    var key = req.url;
    uniq_test[key] = uniq_test[key] || 0;
    ++uniq_test[key];
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("42");
}

httpserver = http.createServer( res_uniqtest );
httpserver.listen(port, '0.0.0.0');
console.log('Server running at http://0.0.0.0:' + port + '/');

var prev_hits = 0;

var timerId = setInterval(function() {
    var hps = hits - prev_hits;
    prev_hits = hits;
    var uniq_hits = Object.keys(uniq_test).length;
    var uniq_percent = 100 * uniq_hits / hits;
    console.log('hits: ' + hits + ' uniq: ' + uniq_hits + ' HPS: ' + hps + ' uniq pers: ' + uniq_percent + '%');
}, 1000);

