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

## ⚖️ License & Commercial Terms

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### 🛡️ Open Source Usage

You are free to use, modify, and distribute this SDK under the terms of the AGPL-3.0.
**Crucially, if you use this SDK to provide a service over a network (SaaS), you must make your entire source code available to your users under the same AGPL-3.0 license.**

### 💼 Commercial & Proprietary Use

If you wish to use this SDK in a commercial product or service **without** being forced to open-source your own proprietary code, you must obtain a **Commercial License**.

A Commercial License provides:

- Permission to use the SDK in closed-source projects.
- Removal of AGPL-3.0 "copyleft" obligations.
- Priority technical support for WebRTC implementation.

**To inquire about commercial licensing or to request permission for use, please contact:**
📧 **Email:** hr.hirenmack@gmail.com
🔗 **Website/Profile:** [LinkedIn](https://www.linkedin.com/in/hiren-rathod-176632117)

---

_Copyright © 2026 Hiren RATHOD. All rights reserved._
