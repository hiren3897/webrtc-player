# WebRTC Player

## DEVELOPMENT

### Project Setup

#### Clone Project

#### Change directory

```bash
cd webrtc-player
```

#### Install Dependencies

```bash
npm install
```

#### Run the project

It will start the development environment using `webpack.config.dev.js`

```bash
npm start
```

### OR

#### Install Docker dev

````bash
```bash
# BUILD THE IMAGE
docker build -f Dockerfile.dev . -t webrtc-player:dev

# RUN THE DOCKER CONTAINER
docker run -p 127.0.0.1:8082:8082 webrtc-player:dev

# This will start the container and map port 8082 on the host to port 8082 in the container. The "-v" flag mounts the current working directory on the host to the "/app" directory inside the container, which allows for live reloading of changes made in the project.
docker run -it --rm -p 8082:8082 -v $(pwd):/app webrtc-player:dev

````

### Build the project

#### Development Build

```
npm run build-dev
```

#### Production Build

```bash
npm run build-prod
```
