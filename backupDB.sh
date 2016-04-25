#!/bin/sh

# root = username
# -proot = -pyoutpasswordhere
#vichan = vichan database
#localhost = servername
mysqldump -u "root" "-proot" "vichan" > vidump.sql


mysql -h "localhost" -u "root" "-proot" -e "CREATE DATABASE vichan2"

#change root and -proot
mysql -u "root" "-proot" "vichan2" < vidump.sql

