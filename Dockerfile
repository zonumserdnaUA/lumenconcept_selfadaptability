FROM ubuntu:16.04

#install mongodb
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/10gen.list
RUN apt-get update
RUN dpkg-divert --local --rename --add /sbin/initctl
RUN apt-get install -y mongodb-org
RUN mkdir -p /data/db

#install nodejs
RUN apt-get install -y git
RUN apt-get install -y npm
RUN apt-get install -y nodejs
RUN apt-get install -y curl
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm cache clean -f
RUN npm install -g n
RUN n stable
RUN npm install npm@latest -g

COPY run_start.sh /scripts/run_start.sh
RUN chmod 777 /scripts/run_start.sh

EXPOSE 4001 27017
ENTRYPOINT ["/scripts/run_start.sh"]