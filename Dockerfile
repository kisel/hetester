FROM node:slim
MAINTAINER Anton Kiselev <anton.kisel@gmail.com>
RUN apt update && apt install -y openssl && rm -r /var/lib/apt /var/cache

COPY testserver.js gencert.sh ./
ENV PORT 80
ENV PORT_SSL 443
CMD node testserver.js

