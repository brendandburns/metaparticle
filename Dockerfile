# On ARM, use this: FROM hypriot/rpi-node:4.3.0-slim
FROM node:4

RUN npm install jayson q minimist loglevel harmony-proxy node-redis-client

ADD *js /
ADD examples/*js /

