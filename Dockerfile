FROM node:18.12.1-alpine3.16 AS build

WORKDIR /build

COPY package* ./
RUN npm ci

COPY *.js *.cjs .*ignore .*rc ./
COPY static/ static/
COPY src/ src/
COPY .env.production .env.production

RUN npm run build
RUN npm prune --production

FROM node:18.12.1-alpine3.16

EXPOSE 3000
WORKDIR /usr/src/service

COPY --from=build /build/node_modules node_modules
COPY --from=build /build/build build
COPY --from=build /build/package.json package.json
COPY --from=build /build/package-lock.json package-lock.json

USER node

CMD ["node", "./build/index.js"]