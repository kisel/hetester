#!/bin/sh
DEST=${1:-cert}
mkdir -p $DEST
cd $DEST
PASS=dummy

openssl genrsa -des3 -passout pass:$PASS -out server.key 1024
openssl req -passin pass:$PASS -new -key server.key -out server.csr -subj '/CN=dummy/O=dummy/C=US'
cp server.key server.key.org
openssl rsa -passin pass:$PASS -in server.key.org -out server.key
openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.crt

