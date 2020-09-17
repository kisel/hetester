Testserver
----------

Small nodejs dummy HTTP(S) server for client and reverse proxy testing

### Running with Docker

    docker run -p 80:80 -p 443:443 -d --name hetester kisel/hetester

### Build from sources

    docker build -t kisel/hetester https://github.com/kisel/hetester.git


### Environment variables:

- BASE_URL: mount base URL, defaults to '/'
- PORT: http port
- PORT_SSL: optional https port
- PORT_AUTODROP: optional port to test dropping tcp connections
- AUTODROP_MODE: 1: close on connect, 2: say Whoops before closing
- DROP_DELAY: delay before applying AUTODROP_MODE
- LOG: stdout logging


### Usage
This server is mostly used as a test dummy for reverse proxy or directly by load generator.
Following URLs are available. To get defails on query args check corresponding URLs

```bash
$ curl http://localhost:80
$ curl -k https://localhost:443
HTTP port: 80<br>
HTTPS port: 443<br>
<br>
Links:<br>
<a href="/empty">/empty</a> - returns empty page immediatly<br>
<a href="/custom">/custom</a> - customizable rc code<br>
<a href="/data">/data</a> - prints random data if size param is specified<br>
<a href="/drop">/drop</a> - connection is dropped immediatly after receiving request to this page<br>
<a href="/rand_status">/rand_status</a> - random HTTP status<br>
<a href="/log">/log</a> - prints request details to console<br>
<a href="/status">/status</a> - current server status<br>
<a href="/store">/store</a> - allows PUT or POST request data<br>
<a href="/login">/login</a> - sets hetester cookie<br>
<a href="/stream">/stream</a> - data stream<br>
<a href="/uniqtest">/uniqtest</a> - unique key test<br>
```

