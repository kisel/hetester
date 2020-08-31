Testserver
----------

Small nodejs dummy HTTP(S) server for client and reverse proxy testing

### Running with Docker
To start http server on port 6080 via Docker

    docker build -t kisel/testserver .
    docker run -p 8000:80 -p 4430:443 -d --name testserver kisel/testserver

