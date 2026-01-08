import {appendChildElement, createButton} from "../utils/dom";
import {Container} from "./container";

export class PlayButton {

    /**
     * Play Button {!HTMLButton}
     */
    webRtcPlayButton

    /**
     * Play Button Icon {!HTMLSpanElement}
     */
    playButtonIcon

    /**
     * Controls Button Panel
     */
    parent

    /**
     *
     * @param parent {!HTMLElement}
     * @param controls {Controls}
     */
    constructor(parent, controls) {

        this.parent = parent;

        this.controls = controls;

        this.video = controls.getVideo();

        this.createPlayButton();

        if (this.controls.presentationIsPaused()) {
            this.playButtonIcon.textContent = 'play_arrow';
        } else {
            this.playButtonIcon.textContent = 'pause';
        }

        this.video.addEventListener('playing', () => {
            this.controls.updatePlayPauseIcon();
        })

        this.webRtcPlayButton.addEventListener('click', () => {
            this.controls.playPausePresentation();
            this.controls.updatePlayPauseIcon();
        })

    }

    createPlayButton() {
        this.webRtcPlayButton = createButton();
        this.webRtcPlayButton.classList.add('webrtc-play-btn');
        this.webRtcPlayButton.setAttribute('type', 'button');

        this.playButtonIcon = document.createElement('span');
        this.playButtonIcon.classList.add('webrtc-player-icons');
        this.playButtonIcon.classList.add('md-22');

        appendChildElement(this.webRtcPlayButton, this.playButtonIcon);

        this.parent.appendChild(this.webRtcPlayButton);
    }

}
