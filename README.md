Testserver
----------

Small nodejs dummy HTTP(S) server for client and reverse proxy testing

### Running with Docker

    docker run -p 80:80 -p 443:443 -d --name hetester kisel/hetester

### Build from sources

    docker build -t kisel/hetester https://github.com/kisel/hetester.git

