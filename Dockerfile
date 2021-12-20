FROM node:17.3.0-alpine3.13 AS build

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