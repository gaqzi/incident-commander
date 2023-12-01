IMAGE_NAME = yjs-socket-relay-server
DOCKERFILE_PATH = ./Dockerfile

build-docker:
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE_PATH) .

run-docker:
	docker run -p 1234:1234 -d $(IMAGE_NAME)