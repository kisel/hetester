/** Node.js test server
 */

var http = require('http');
var url  = require('url');
var net  = require('net');
var port = process.env.PORT || 6080;
var port_ssl = process.env.PORT_SSL;
var port_autodrop = process.env.PORT_AUTODROP;
var autodrop_mode = process.env.AUTODROP_MODE || 1;
var drop_delay = process.env.DROP_DELAY || 0;
var httpconnstat = process.env.HTTP_CONN_STAT;
var log_enabled = process.env.LOG;
var key_prefix='cert/server.'

var LAST_LOG_REQUEST = null;

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});

function generatedhint()
{
    return "\nPage generated at: " + new Date().getTime() + "\n";
}

function request_to_json(req, callback) {
    res = {}
    res['from_ip'] = req.connection.remoteAddress;
    res['timestamp'] = new Date().getTime();
    res['url'] = req.url;
    res['method'] = req.method;
    res['headers'] = req.headers;

    if (req.method == 'POST' || req.method == 'PUT') {
        var buf = "";
        req.on('data', function (data) { buf += data; });
        req.on('end', function () {
            res['data'] = buf;
            callback(res);
        });
    } else {
        callback(res);
    }
}

function log_request (req) {
    console.log("[" + new Date().getTime() + "] got request: " + req.url);
    console.log("from IP: " + req.connection.remoteAddress);
    console.log("HEADERS: ");
    console.log(JSON.stringify(req.headers));

    if (req.method == 'POST' || req.method == 'PUT') {
        var body = "";
        req.on('data', function (data) { body += data; });
        req.on('end', function () {
            console.log("POST data. size: " + body.length);
            var data=body;
            for(var i = 0, len=data.length; i < len; ++i) {
                console.log("'" + data[i] + "' - " + data.charCodeAt(i));
            }
            console.log(body);
            //var POST = qs.parse(body);
        });
    }
}

function res_drop (req, res) {
    req.connection.destroy();
}

function res_rand_status (req, res) {
    var sc = Math.round(Math.random() * 400 + 100);
    res.writeHead(sc, {'Content-Type': 'text/plain'});
    res.write('Status code: ' + sc);
    res.end("\n" + generatedhint());
}


function res_data (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var size = url.parse(req.url, true).query.size || 0;
    var vzb = size * 1024;
    var pr = 'ARG[size] is ' + size + ' kb\n';
    res.write(pr);
    var csz = pr.length;

    while(csz < vzb)
    {
        var ds = 'data: ' + Math.random() + '\n';
        csz += ds.length;
        res.write(ds);
    }
    res.end('\n');
}

function res_stream (req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var duration = query.duration || 5000;
    var interval = 100;
    var max_count = duration / interval;

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("Possible URL query args: duration[5000]\n");

    var cnt = [0];
    function streamit() {
        var idx = ++cnt[0];
        res.write('\n' + idx);
        if (idx <= max_count)
            setTimeout(streamit, interval);
        else
            res.end('\n' + generatedhint());
    };
    setTimeout(streamit, 50);
}

function res_custom (req, res) {
    var url_parts = url.parse(req.url, true);

    var query = url_parts.query;
    var rc = query.rc || 200;
    var delay = query.delay || 0;
    var hdelay = query.hdelay || delay;
    var duration = query.duration || 0;

    if (query.log) {
        log_request(req);
    }

    if (query.dropafter) {
        setTimeout( function() { req.connection.destroy(); }, query.dropafter);
    }

    function sendheader() {
        res.writeHead(rc, {'Content-Type': 'text/plain'});
        if (query.hdelay) {
            res.socket.write(res._header);
            res._headerSent = true;
        }
    }

    function sendcontent() {
        res.write("Possible URL GET args: rc[200], delay[nil], hdelay[=delay], duration, dropafter[nil]\n");
        res.write("path: " + Object.keys(query) + '\n');
        res.write('test page\nrc:' + res.statusCode + '\n');

        var interval = 100;
        var max_count = duration / interval + 1;

        var cnt = 0;
        function streamit() {
            var idx = ++cnt;
            res.write('part ' + idx + '/' + max_count + '\n');
            if (idx < max_count)
                setTimeout(streamit, interval);
            else
                res.end('\n' + generatedhint());
        };
        streamit();
    }

    setTimeout(sendheader, hdelay);
    setTimeout(sendcontent, delay);
}

var recmapp = {}

function res_index (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("HTTP port: " + port + '<br>\n');
    res.write("HTTPS port: " + port_ssl + '<br>\n');
    res.write("<br>\nLinks:<br>\n");
    for (var key in recmapp) {
        if (recmapp.hasOwnProperty(key)) {
            var val = recmapp[key];
            var lnk = key;
            var desc = val[1];
            if (!desc)
                continue;
            res.write("<a href=\"" + lnk+ "\">" + lnk + "</a>" + " - " + desc + "<br>\n");
        }
    }
    res.end("\n\n" + generatedhint());
}

function res_log (req, res) {
    log_request(req);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    request_to_json(req, function(req_json) {
        LAST_LOG_REQUEST = req_json;
        res.write("Request information:\nThis data is also available at  \nhetester.herokuapp.com/status\n\n" + JSON.stringify(req_json) + "\n\n");
        res.end(generatedhint());
        });
}

function res_empty (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(generatedhint());
}

function res_status (req, res) {
    var url_parts = url.parse(req.url, true);
    var baseurl = '/' + url_parts.pathname.split('/')[1];
    if ('/status/data' == url_parts.pathname) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        data = LAST_LOG_REQUEST && LAST_LOG_REQUEST['data'] || "";
        res.write(data);
        res.end("\n\n" + generatedhint());
    } else {
        res.writeHead(200, {'Content-Type': 'application/json'});
        jres = {
            "active_connections" : ACTIVE_CONNECTIONS,
            "timestamp" : new Date().getTime(),
            "last_log_request" : LAST_LOG_REQUEST,
        };
        res.write(JSON.stringify(jres));
        res.end();
    }
}

var storage = {};
function res_store (req, res) {
    if (req.method == 'POST' || req.method == 'PUT') {
        var body = "";
        req.on('data', function (data) { body += data; });
        req.on('end', function () {
            storage[req.url] = body;
        });
    }

    var val = storage[req.url];
    if (!val) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("Not found");
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(val);
    }
}

var loginid = 0;
function res_login (req, res) {
    var cookie = 'hetester=mycookie-'+(++loginid);
    headers = {
        'Content-Type': 'text/plain',
        'Set-Cookie': cookie,
    }
    res.writeHead(200, headers);
    res.end('OK. generated new cookie. ID:' + loginid + "\n");
}

recmapp = {
    '/' : [ res_index ],
};

// following functions are automatically mounted to / ( without res prefix )
var autoreg = [
    res_index, null,
    res_empty, "returns empty page immediatly",
    res_custom, "customizable rc code",
    res_data, "prints random data if size param is specified",
    res_drop, "connection is dropped immediatly after receiving request to this page",
    res_rand_status, "random HTTP status",
    res_log, "prints request details to console",
    res_status, "current server status",
    res_store, "allows PUT or POST request data",
    res_login, "sets hetester cookie",
    res_stream, "data stream",
    ];

for(var i = 0, l=autoreg.length; i < l; i+=2)
{
    var func = autoreg[i];
    var desc = autoreg[i + 1];

    recmapp[ '/' + func.name.substr(4)] = [func, desc];
}

function reqmapper (req, res) {
    if (log_enabled == '1') {
        console.log('Request ' + req.url);
    }
    if (log_enabled == '2') {
        log_request(req);
    }
    var url_parts = url.parse(req.url, true);
    var baseurl = '/' + url_parts.pathname.split('/')[1];
    handler = recmapp[baseurl];
    if (handler) {
        return handler[0](req, res);
    } else if (req.url.indexOf('/mu-') == 0) { // mu authorization
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('42');
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('Page not found');
        res.end(generatedhint());
    }
}

httpserver = http.createServer( reqmapper )
httpserver.listen(port, '0.0.0.0');
ACTIVE_CONNECTIONS = 0;

httpserver.on('connection', function(client) { ++ACTIVE_CONNECTIONS; client.setNoDelay();

    if (log_enabled) {
        console.log('Connected');
    }
    client.on('error', function(error) {
        //console.log('event error ' + error);
    });

    client.on('close', function(socket) {
        //console.log('event close');
        if (log_enabled) {
            console.log('Disconnected');
        }
        --ACTIVE_CONNECTIONS;
    });
});



console.log('Server running at http://0.0.0.0:' + port + '/');
console.log('Server max connections: ' + httpserver.maxConnections);

var fs = require('fs');

if (port_ssl)
{
    var https = require('https');

    var options = {
        key: fs.readFileSync(key_prefix + 'key'),
        cert: fs.readFileSync(key_prefix + 'crt')
    };

    https.createServer(options, reqmapper).listen(port_ssl);
    console.log('Server running at https://0.0.0.0:' + port_ssl + '/');
}

if (port_autodrop)
{
    function drop_socket(socket) {
        try{
            var dropit = function() {
                if (1 == autodrop_mode) {
                    socket.destroy();
                } else if (2 == autodrop_mode) {
                    socket.end("Whoops");
                }
            }
            if (drop_delay)
                setTimeout(dropit, drop_delay);
            else
                dropit();
        } catch (ex) {
        }
    }

    var autodrop_server = net.createServer(drop_socket).listen(port_autodrop, function() { console.log('server bound'); });
    console.log('Started autodrop server at 0.0.0.0:' + port_autodrop);
}


if (httpconnstat) {
    var timerId = setInterval(function() {
        console.log("Active connections: " + ACTIVE_CONNECTIONS);
    }, 1000);
}

