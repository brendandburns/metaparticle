FROM hypriot/rpi-node:4.3.0-slim

RUN npm install jayson
RUN npm install q
RUN npm install minimist
# TODO: These can be removed with some refactoring
RUN npm install dockerode
RUN npm install loglevel

ADD metaparticle.js /metaparticle.js
ADD metaparticle-docker.js /metaparticle-docker.js
ADD metaparticle-kubernetes.js /metaparticle-kubernetes.js
ADD metaparticle-util.js /metaparticle-util.js
ADD server.js /server.js
ADD server2.js /server2.js
ADD client.js /client.js
