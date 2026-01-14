# WebRTC Stream Flux: FFmpeg & MediaMTX

This guide explains how to establish an ultra-low latency WebRTC stream on localhost using FFmpeg as the media publisher and MediaMTX as the signaling and distribution server.

## 🚀 Overview

In this workflow, FFmpeg captures your camera and encodes it into an RTMP stream. MediaMTX ingests that stream and provides a WHEP (WebRTC-HTTP Egress Protocol) endpoint, which is the 2026 industry standard for sub-second latency playback in browsers.

### 🛠 1. Prerequisites

Ensure you have Homebrew installed, then run:

```bash
# Install FFmpeg 8.0+
brew install ffmpeg

# Install MediaMTX
brew install mediamtx
```

### ⚙️ 2. MediaMTX Configuration

Create a file named mediamtx.yml in your project root. This configuration opens the server to accept local publishers and serve WebRTC content.

```yaml
yaml
# mediamtx.yml
paths:
  all:
    # Allow FFmpeg to create paths dynamically
    source: publisher

# WebRTC Settings
webrtc: yes
webrtcAddress: :8889
```

#### Start the server:

```bash
mediamtx ./mediamtx.yml
```

Keep this terminal running. You should see logs confirming the RTMP and WebRTC listeners are active.

### 📹 3. Publish Stream with FFmpeg

Open a new terminal tab. Use the following command to capture your Mac's camera and send it to MediaMTX.

```bash
ffmpeg -f avfoundation -framerate 30 -video_size 1280x720 -i "0" \
-c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p \
-f flv rtmp://127.0.0.1/mystream
```

##### Command Breakdown:

- -f avfoundation: macOS native multimedia framework.
- -i "0": The index of your camera (use ffmpeg -f avfoundation -list_devices true -i "" to list all).
- -c:v libx264: H.264 software encoder (standard for WebRTC).
- -tune zerolatency: Disables internal buffers for the fastest possible stream.
- rtmp://127.0.0.1/live/mystream: The destination path on your local server.

### 📺 4. Playback (The WebRTC Flux)

#### A. The Built-in Player (easiest)

Navigate to the following URL in Chrome or Safari:
👉 127.0.0.1

#### B. Custom JavaScript Integration (WHEP) WebRTC PLayer

To integrate the stream into your own app, use a WHEP client. The standard signaling URL for 2026 is:
127.0.0.1
WHEP Workflow:
Create a RTCPeerConnection.
Generate an SDP Offer.
POST the Offer to the WHEP URL above.

### 🍎 Pro-Tip: Apple Silicon Optimization

For significantly lower CPU usage on M1/M2/M3/M4 Macs, use the hardware-accelerated encoder:

```bash
ffmpeg -f avfoundation -i "0" -c:v h264_videotoolbox -b:v 2500k -realtime 1 -f flv rtmp://127.0.0.1/live/mystream
```

Last updated: January 2026
