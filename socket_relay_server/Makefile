.PHONY: build run test lint clean docker run-docker

CONTAINER_ENGINE?=docker
IMAGE_NAME?=incom-tool-socket-server
export CONTAINER_ENGINE _
export IMAGE_NAME _

docker:
	$(CONTAINER_ENGINE) build -t $(IMAGE_NAME) . --progress=plain

run-docker:
	$(CONTAINER_ENGINE) run -p 8080:1234 -d $(IMAGE_NAME)
