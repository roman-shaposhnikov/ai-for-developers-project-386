FROM node:24 as base
RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install -y ripgrep

FROM base as devcontainer
RUN npm install -g opencode-ai
RUN npm install -g @anthropic-ai/claude-code

EXPOSE 8080
EXPOSE 3000
