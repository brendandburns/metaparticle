FROM hypriot/rpi-node:4.3.0-slim

RUN npm install jayson q minimist loglevel harmony-proxy

ADD *js /

