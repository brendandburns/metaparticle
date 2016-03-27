FROM hypriot/rpi-node:4.3.0-slim

RUN npm install jayson
RUN npm install q
RUN npm install minimist
# TODO: These can be removed with some refactoring
RUN npm install dockerode
RUN npm install loglevel

ADD *js /

