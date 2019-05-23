FROM node:10-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# RUN mkdir -p /home/node/monitoring_service && chown -R node:node /home/node/monitoring_service

WORKDIR /home/node/monitoring_service

# USER node

ADD . /home/node/monitoring_service

RUN mkdir /home/node/monitoring_service/logs
RUN chmod 755 /home/node/monitoring_service/logs
RUN npm install pm2 -g

EXPOSE 3000

CMD [ "pm2-runtime", "index.js" ]