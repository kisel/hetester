Testserver
----------

To start http server on port 6080 via Docker

    docker build -t kisel/hetester .
    docker run -p 6080:6080 -d --name hetester kisel/hetester 

