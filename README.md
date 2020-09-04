Testserver
----------

Small nodejs dummy HTTP(S) server for client and reverse proxy testing

### Running with Docker

    docker run -p 8000:80 -p 4430:443 -d --name testserver kisel/testserver

### Build from sources

    docker build -t kisel/testserver https://github.com/kisel/testserver.git

