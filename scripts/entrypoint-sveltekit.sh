#!/bin/bash

npm run build

npm prune --production
rm -rf ./src

node ./build/index.js