import {Controls} from "./controls";

export default class Ui {

    /**
     * WebRTC Container {!HTMLElement}
     */
    videoContainer;

    /**
     * {HTMLVideoElement}
     */
    video

    /**
     * WebRtc Player Controls
     */
    controls

    /**
     *
     * @param videoContainer {!HTMLElement}
     * @param video {!HTMLVideoElement}
     * @param config {Object}
     */
    constructor(videoContainer, video, config) {

        this.videoContainer = videoContainer;

        this.video = video;

        this.config = config;

        videoContainer['ui'] = this;
        video['ui'] = this;

        // Tag the container for mobile platforms, to allow different styles.

        this.controls = new Controls(videoContainer, video, config);
    }


    getWebRTCConfiguration() {
        return this.config;
    }

    /**
     * @export
     * @returns {Controls}
     */
    getWebRTCControls() {
        return this.controls;
    }

    defaultConfig() {
        return {};
    }
}
