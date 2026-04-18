FROM node:24 AS base

RUN echo 'node:1234' | chpasswd
RUN apt update && apt install -y sudo
RUN usermod -aG sudo node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

FROM base AS devcontainer

RUN npm install -g opencode-ai

# front
EXPOSE 8080

# back
EXPOSE 3000
