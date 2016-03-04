FROM hypriot/rpi-node:4.3.0-slim

RUN npm install jayson
RUN npm install q
RUN npm install dockerode

ADD metaparticle.js /metaparticle.js
ADD metaparticle-docker.js /metaparticle-docker.js
ADD server.js /server.js
ADD server2.js /server2.js
ADD client.js /client.js
