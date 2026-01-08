import '../scss/index.scss';

import Receiver from "./receiver";
import Ui from "./ui/ui";
import "./static/adapter-latest";

/**
 * A WebRTC player RTSP/RTMP Stream to WebBrowser over WebRTC based on Pion
 */
export default class WebRTCPlayer {

    static ON_LOAD_ASSET = 'loadasset';
    static ON_ASSET_LOADED = 'loadassetsuccess';

    static ON_ADD_LOG = 'addlog';

    /**
     * HTMLVideoElement
     * @type {HTMLVideoElement}
     */
    video = null;

    /**
     * Player Loaded
     * @type {Boolean | BooleanConstructor}
     */
    playerLoaded = Boolean;

    /**
     *
     * @type {{onDemand: null, onStatusChange: null, iceServers: [], assetUri: string, ui: {screenshot: false}}
     */
    options = {
        onStatusChange: null, assetUri: '', onDemand: null, ui: {screenshot: false}
    };


    /**
     * Logs of player
     */
    logs

    /**
     * Web RTC player Version
     */
    webRtcPlayerVersion;

    /**
     * {Ui}
     */
    webRtcUi

    /**
     *
     */
    webRtcControls;

    /**
     * WebRTC Receiver
     */
    receiver


    constructor(id, videoContainer, options = {}) {
        this.video = document.getElementById(id);
        this.playerLoaded = false;
        this.logs = [];
        this.receiver = null;
        this.videoContainer = videoContainer;

        Object.assign(this.options, options);

        this.webRtcUi = new Ui(videoContainer, this.video, this.options);

        this.webRtcControls = this.webRtcUi.getWebRTCControls();

        this.videoContainer.addEventListener(WebRTCPlayer.ON_ADD_LOG, (event) => {
            this.createLog(event.logName, event.logMessage);
        })

        this.webRtcPlayerVersion = process.env.WebRTCVersion;

        this.oniOSExitFullScreenMode();
    }

    load() {
        this.receiver = new Receiver(
          this.video,
          this.videoContainer,
          this.options.webRtcUrl,
            this.options.retryParameters);
        this.playerLoaded = true;
        this.createLog('Loaded', 'WebRTC player was Loaded');
    }

    onLoadAsset(options) {
        if (this.playerLoaded) {
            this.destroy();
        }
        this.receiver = new Receiver(this.video, options.webRtcUrl);
        this.playerLoaded = true;

        const webRtcLoadedEvent = new Event(WebRTCPlayer.ON_ASSET_LOADED)
        webRtcLoadedEvent.options = options;
        this.video.dispatchEvent(webRtcLoadedEvent);
    }

    destroy() {
        this.receiver.destroyReceiver();
        this.receiver = null;
        this.playerLoaded = false;
        this.createLog('Destroy', 'Player was destroyed')
    }

    getVideo() {
        return this.video;
    }

    /**
     * CREATE LOGS
     * @param name
     * @param message
     */
    createLog(name, message) {
        this.logs.push({
            name, message
        })
    }

    getPlayerLogs() {
        if (this.logs.length === 0) {
            return  {}
        }
        return this.logs.reverse();
    }

    oniOSExitFullScreenMode() {
        this.video.addEventListener("webkitendfullscreen", () => {
            setTimeout(() => {
                if (this.video.paused) {
                    this.video.play();
                }
            }, 460); // 460 minimum edge require to exit fullScreenMode and trickPlay the video of paused
        }, false);
    }

    isPreviousDisconnection() {
        const disconnectLogs = this.logs.filter((log) => log.name === 'Disconnected')
        return disconnectLogs.length > 0;
    }
}
