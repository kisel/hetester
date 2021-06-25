FROM node:alpine
MAINTAINER Anton Kiselev <anton.kisel@gmail.com>
RUN apk add openssl
COPY testserver.js gencert.sh ./
ENV PORT 80
ENV PORT_SSL 443
CMD node testserver.js

