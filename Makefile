unit-test-coverage:
	npm install --legacy-peer-deps --save-exact
	npm run test

build-preproduction:
	npm install --legacy-peer-deps --save-exact
	npm run build:preprod

build-production:
	npm install --legacy-peer-deps --save-exact
	npm run build

docker-build-preprod:
	docker build -t wec-fe-shop -f Dockerfile .
