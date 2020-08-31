FROM node
MAINTAINER Anton Kiselev <anton.kisel@gmail.com>

COPY testserver.js gencert.sh ./
ENV PORT 80
ENV PORT_SSL 443
CMD node testserver.js

