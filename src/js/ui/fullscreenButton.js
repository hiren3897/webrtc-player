export class FullscreenButton {
    /**
     * Controls Button Panel
     */
    parent;

    /**
     *
     * @param parent {!HTMLElement}
     * @param controls {Controls}
     */
    constructor(parent, controls) {

        this.parent = parent;

        this.controls = controls;

        this.video = controls.getVideo();

        this.createFullscreenButton();

        this.webRtcFullscreenButton.addEventListener('click', async () => {
            await this.controls.toggleFullscreen();
        })

        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenIcon();
            if (this.controls.isFullScreenEnabled()) {
                this.controls.container.getWebRtcVideoContainer().style.display = 'block';
            } else {
                this.controls.container.getWebRtcVideoContainer().style.display = 'flex';
            }
        })
    }

    createFullscreenButton() {
        this.webRtcFullscreenButton = document.createElement('button');
        this.webRtcFullscreenButton.classList.add('webrtc-player-fullscreen-btn')
        this.webRtcFullscreenButton.setAttribute('type', 'button');

        this.fullscreenButtonIcon = document.createElement('span');
        this.fullscreenButtonIcon.classList.add('webrtc-player-icons');
        this.fullscreenButtonIcon.classList.add('md-22');
        this.fullscreenButtonIcon.textContent = 'fullscreen';
        this.webRtcFullscreenButton.appendChild(this.fullscreenButtonIcon);

        this.parent.appendChild(this.webRtcFullscreenButton);
    }

    updateFullscreenIcon() {
        this.fullscreenButtonIcon.textContent =
            this.controls.isFullScreenEnabled() ?
                'fullscreen_exit' :
                'fullscreen';
    }

}
