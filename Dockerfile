FROM node:16.13.1-alpine3.14 AS build

WORKDIR /build

COPY package* ./
RUN npm ci

COPY *.js *.cjs .*ignore .*rc ./
COPY static/ static/
COPY src/ src/
# COPY __tests__/ __tests__/
# COPY jest.json jest.json

COPY scripts scripts

EXPOSE 3000

ENTRYPOINT [ "ash", "./scripts/entrypoint-sveltekit.sh" ]