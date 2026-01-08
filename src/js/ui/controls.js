import {Container} from "./container";
import {PlayButton} from "./playButton";
import {MuteButton} from "./muteButton";
import {FullscreenButton} from "./fullscreenButton";
import {Seekbar} from "./seekbar";
import {VolumeBar} from "./volumeBar";
import {Platform} from "../utils/platform";
import {LiveButton} from "./liveButton";
import {ScreenshotButton} from "./screenshotButton"

export class Controls {

    /**
     * {Container}
     */
    container;

    /**
     * Controls container
     * @param videoContainer
     * @param video
     * @param config
     */
    constructor(videoContainer, video, config) {
        this.config = config;
        this.video = video;
        this.videoContainer = videoContainer;

        this.seekBar = null;

        this.container = new Container(videoContainer, video);

        this.controlsButtonPanel = this.container.getControlsButtonPanel();
        this.bottomControlsContainer = this.container.getBottomControlsContainer();

        this.createControls();

        if (Platform.isMobile()) {
            this.video.addEventListener('play', () => {
                this.video.play();
            })
        }
    }

    /**
     *
     */
    createControls() {
        // Configure with config?
        // add play button
        this.playButton_ = new PlayButton(this.controlsButtonPanel, this);

        // live button
        this.liveButton_ = new LiveButton(this.controlsButtonPanel, this);

        // Spacer Element
        this.addSpacerElement();

        if(this.config.ui.screenshot) {
            // screenshot button
            this.screenshotButton_ = new ScreenshotButton(this.controlsButtonPanel, this)
        }

        // mute/unmute button
        this.muteButton_ = new MuteButton(this.controlsButtonPanel, this);

        //volume bar
        this.volumeBar_ = new VolumeBar(this.controlsButtonPanel, this);

        // fullscreen button
        this.fullscreenButton_ = new FullscreenButton(this.controlsButtonPanel, this)

        //  seekbar
        this.seekBar = new Seekbar(this.bottomControlsContainer, this);
    }

    addSpacerElement() {
        this.webRtcSpacerElement = document.createElement('div');
        this.webRtcSpacerElement.classList.add('webrtc-spacer');
        this.controlsButtonPanel.appendChild(this.webRtcSpacerElement);
    }

    getVideo() {
        return this.video;
    }

    getSeekBar() {
        return this.seekBar;
    }

    updatePlayPauseIcon() {
        if (this.presentationIsPaused()) {
            this.playButton_.playButtonIcon.textContent = 'play_arrow';
            return;
        }
        this.playButton_.playButtonIcon.textContent = 'pause';
    }

    updateMuteIcon() {
        if (this.video.muted) {
            this.muteButton_.muteButtonIcon.textContent = 'volume_off';
            return;
        }
        this.muteButton_.muteButtonIcon.textContent = 'volume_up';
    }


    /**
     * Return true if the presentation is paused.
     *
     * @return {boolean}
     */
    presentationIsPaused() {
        // The video element is in a paused state while seeking, but we don't count
        // that.
        return this.video.paused
    }

    /**
     * Play or pause the current presentation.
     */
    playPausePresentation() {
        if (!this.video.duration) {
            // Can't play yet.  Ignore.
            return;
        }

        if (this.presentationIsPaused()) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    muteUnmuteVideo() {
        if (!this.video.duration) {
            // Can't mute/unmute yet.  Ignore.
            return;
        }

        if (this.video.muted) {
            this.unmute()
        } else {
            this.mute();
        }
    }

    mute() {
        this.video.muted = true
    }

    unmute() {
        this.video.muted = false
    }

    screenshot() {
        let canvas = document.createElement("canvas");
        // Calculate the ratio of the video's width to height
        const ratio = this.video.clientWidth / this.video.clientHeight;
        // Define the required width as 100 pixels smaller than the actual video's width
        const w = this.video.clientWidth - 100;
        // Calculate the height based on the video's width and the ratio
        const h = parseInt(w / ratio, 10);
        // Set the canvas width and height to the values just calculated
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').fillRect(0, 0, w, h);

        canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);
        let dataURL = canvas.toDataURL();
        const link = document.createElement('a');
        link.download = 'screenshot.png';
        link.href = dataURL
        link.click();
        // eslint-disable-next-line no-unused-expressions
        link.delete;
        canvas.remove();
        return dataURL;
    }

    /**
     * @return {boolean}
     * @export
     */
    isFullScreenEnabled() {
        if (document.fullscreenEnabled) {
            return !!document.fullscreenElement;
        }
        const video = /** @type {HTMLVideoElement} */(this.video);
        if (video.webkitSupportsFullscreen) {
            return video.webkitDisplayingFullscreen;
        }
        return false;
    }

    async toggleFullscreen() {
        if (document.fullscreenEnabled) {
            if (document.fullscreenElement) {
                if (screen.orientation) {
                    screen.orientation.unlock();
                }
                await document.exitFullscreen();
            } else {
                // If we are in PiP mode, leave PiP mode first.
                try {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                    }
                    await this.videoContainer.requestFullscreen({navigationUI: 'hide'});
                } catch (error) {
                    console.error(error)
                }
            }
        } else {
            const video = /** @type {HTMLVideoElement} */(this.video);
            if (video.webkitSupportsFullscreen) {
                if (video.webkitDisplayingFullscreen) {
                    video.webkitExitFullscreen();
                } else {
                    video.webkitEnterFullscreen();
                }
            }
        }
    }

}
