onboard: install

open: 
	code .

install:
	npm ci

dev:
	npm run dev

prod:
	npm run build
	npx dotenv -e .env.production -- node ./build/index.js