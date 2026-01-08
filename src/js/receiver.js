import WebRTCPlayer from './webRTCPlayer';
import {Timer} from "./utils/timer";
import {convertMsToSeconds} from "./utils/shared";

export default class Receiver {
    /**
     * HTML video element
     * {HTMLVideoElement}
     */
    video;

    constructor(video, videoContainer, webRtcUrl, retryParameters) {
        this.terminated = false;
        this.video = video;
        this.videoContainer = videoContainer;
        
        // Ensure URL points to the WHEP endpoint
        this.webRtcUrl = webRtcUrl.endsWith('/whep') ? webRtcUrl : `${webRtcUrl}/whep`;
        
        this.pc = null;
        this.retryCounts_ = 0;
        this.retryParameters = retryParameters;
        this.isRestartFromClick_ = false;

        this.scheduler = new Timer(() => {
            this.isRestartFromClick_ = false;
            this.scheduleRestart();
            this.onWebRtcError(
                'WebRTC Error',
                404,
                `Retrying to connect..., attempt: ${this.retryCounts_}`);
        });

        this.start();
    }

    async start() {
        try {
            // 1. Initialize PeerConnection
            this.pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            // 2. Handle incoming media tracks
            this.pc.ontrack = (evt) => {
                if (this.video.srcObject !== evt.streams[0]) {
                    this.video.srcObject = evt.streams[0];
                    this.pushLogs('Success', 'Remote stream track received');
                }
            };

            // 3. Monitor Connection State
            this.pc.onconnectionstatechange = () => {
                const state = this.pc ? this.pc.connectionState : 'destroyed';
                this.pushLogs('ConnectionState', state);

                if (state === "failed" || state === "disconnected") {
                    this.handleRetryLogic();
                } else if (state === "connected") {
                    this.retryCounts_ = 0;
                }
            };

            // 4. Setup Transceivers (Receive Only)
            this.pc.addTransceiver("video", { direction: "recvonly" });
            this.pc.addTransceiver("audio", { direction: "recvonly" });

            // 5. Create SDP Offer
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);

            // 6. Exchange SDP via WHEP (HTTP POST)
            // We wait for ICE gathering to complete for faster local connection
            await new Promise((resolve) => {
                if (this.pc.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    const checkState = () => {
                        if (this.pc.iceGatheringState === 'complete') {
                            this.pc.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    };
                    this.pc.addEventListener('icegatheringstatechange', checkState);
                }
            });

            const response = await fetch(this.webRtcUrl, {
                method: 'POST',
                body: this.pc.localDescription.sdp,
                headers: {
                    'Content-Type': 'application/sdp'
                }
            });

            if (!response.ok) {
                throw new Error(`WHEP Server responded with ${response.status}`);
            }

            // 7. Apply Answer from MediaMTX
            const answerSdp = await response.text();
            await this.pc.setRemoteDescription(new RTCSessionDescription({
                type: 'answer',
                sdp: answerSdp
            }));

            this.pushLogs('WHEP', 'SDP Handshake Successful');

        } catch (err) {
            this.pushLogs('ERROR', `WHEP Connection Failed: ${err.message}`);
            this.handleRetryLogic();
        }
    }

    handleRetryLogic() {
        if (this.terminated) return;
        
        if (!this.isRestartFromClick_) {
            if (this.retryCounts_ >= this.retryParameters.maxAttempts) {
                this.retryCounts_ = 0;
                return;
            }
            
            const delay = convertMsToSeconds(this.retryParameters.baseDelay) * (this.retryCounts_ + 1);
            this.scheduler.tickEvery(delay);
            this.retryCounts_ += 1;
        }
    }

    scheduleRestart() {
        if (this.terminated) return;
        this.cleanUp();
        this.start();
    }

    cleanUp() {
        if (this.pc) {
            this.pc.getSenders().forEach(sender => this.pc.removeTrack(sender));
            this.pc.close();
            this.pc = null;
        }
    }

    destroyReceiver() {
        this.terminated = true;
        this.scheduler.stop();
        this.cleanUp();
    }

    getWebRtcConnectionState() {
        this.isRestartFromClick_ = true;
        const state = this.pc?.connectionState;
        if (!this.pc || state === 'disconnected' || state === 'failed') {
            this.scheduleRestart();
            return false;
        }
        return state === 'connected';
    }

    pushLogs(logName, logMessage) {
        const event = new Event(WebRTCPlayer.ON_ADD_LOG);
        event.logName = logName;
        event.logMessage = logMessage;
        this.videoContainer.dispatchEvent(event);
    }

    onWebRtcError(error, code, message) {
        const event = new Event(WebRTCPlayer.ON_WEBRTC_PLAYER_ERROR);
        event.error = error;
        event.code = code;
        event.message = message;
        this.video.dispatchEvent(event);
        this.pushLogs(error, message);
    }
}
