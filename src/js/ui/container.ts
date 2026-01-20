import { IStreamController } from '../types';
import { appendChildElement, createHTMLElement } from '../utils/dom';
import { Timer } from '../utils/timer';
import { WebRTCVideoContainer } from './interfaces';

export class Container {
  controller: IStreamController;
  webRtcContainer: WebRTCVideoContainer;
  private recentMouseMovement_: boolean;
  private mouseStillTimer: Timer;
  private fadeControlsTimer_: Timer;
  private webRtcControlsContainer!: HTMLElement;
  private webRtcBottomControlsContainer!: HTMLElement;
  private webRtcControlsButtonPanel!: HTMLElement;

  private lastTouchEventTime_: number | null;
  /**
   * WebRTC Video Container
   */
  constructor(
    videoContainer: WebRTCVideoContainer,
    controller: IStreamController,
  ) {
    this.webRtcContainer = videoContainer;
    this.controller = controller;

    this.createDOM();
    this.addEventListeners();

    /** @private {boolean} */
    this.recentMouseMovement_ = false;

    /**
     * This timer is used to detect when the user has stopped moving the mouse
     * and we should fade out the ui.
     *
     * @private {Timer}
     */
    this.mouseStillTimer = new Timer(() => {
      this.onMouseStill();
    });

    /**
     * This timer is used to delay the fading of the UI.
     *
     * @private {Timer}
     */
    this.fadeControlsTimer_ = new Timer(() => {
      this.webRtcControlsContainer.removeAttribute('shown');
      this.webRtcControlsContainer.style.opacity = '0';
    });

    /** @private {?number} */
    this.lastTouchEventTime_ = null;
  }

  createDOM() {
    this.addWebRtcControlsContainer();
    this.addScrimContainer();
    this.addWebRtcBottomControlsContainer();
    this.addWebRtcBottomControlsPanel();
  }

  addWebRtcControlsContainer() {
    this.webRtcControlsContainer = createHTMLElement('div');
    this.webRtcControlsContainer.classList.add('webrtc-controls-container');
    appendChildElement(this.webRtcContainer, this.webRtcControlsContainer);

    this.webRtcControlsContainer.addEventListener(
      'touchstart',
      (e) => {
        this.onContainerTouch(e);
      },
      { passive: false },
    );
  }

  addWebRtcBottomControlsContainer() {
    this.webRtcBottomControlsContainer = createHTMLElement('div');
    this.webRtcBottomControlsContainer.classList.add('webrtc-bottom-controls');
    appendChildElement(
      this.webRtcControlsContainer,
      this.webRtcBottomControlsContainer,
    );
  }

  addWebRtcBottomControlsPanel() {
    this.webRtcControlsButtonPanel = createHTMLElement('div');
    this.webRtcControlsButtonPanel.classList.add(
      'webrtc-controls-button-panel',
    );
    appendChildElement(
      this.webRtcBottomControlsContainer,
      this.webRtcControlsButtonPanel,
    );
  }

  /** @private */
  addScrimContainer() {
    // This is the container that gets styled by CSS to have the
    // black gradient scrim at the end of the controls.
    const scrimContainer = createHTMLElement('div');
    scrimContainer.classList.add('webrtc-scrim-container');
    this.webRtcControlsContainer.appendChild(scrimContainer);
  }

  addEventListeners() {
    /**
     * Web Browser
     */
    this.webRtcContainer.addEventListener('mousemove', (e) => {
      this.onMouseMove(e);
    });

    this.webRtcContainer.addEventListener(
      'touchmove',
      (e) => {
        this.onMouseMove(e);
      },
      { passive: true },
    );

    this.webRtcContainer.addEventListener(
      'touchend',
      (e) => {
        this.onMouseMove(e);
      },
      { passive: true },
    );
    /**
     * Web Browser
     */
    this.webRtcContainer.addEventListener('mouseleave', (e) => {
      this.onMouseLeave();
    });
  }

  /**
   * This callback is for when we are pretty sure that the mouse has stopped
   * moving (aka the mouse is still). This method should only be called via
   * |mouseStillTimer_|. If this behaviour needs to be invoked directly, use
   * |mouseStillTimer_.tickNow()|.
   *
   * @private
   */
  onMouseStill() {
    // Hide the cursor.
    this.webRtcContainer.style.cursor = 'none';
    this.recentMouseMovement_ = false;
    this.computeOpacity();
  }

  /** @private */
  onMouseLeave() {
    // We sometimes get 'mouseout' events with touches.  Since we can never
    // leave the video element when touching, ignore.
    if (this.lastTouchEventTime_) {
      return;
    }

    // Stop the timer and invoke the callback now to hide the controls.  If we
    // don't, the opacity style we set in onMouseMove_ will continue to override
    // the opacity in CSS and force the controls to stay visible.
    this.mouseStillTimer.tickNow();
  }

  /**
   * @param {!Event} event
   * @private
   */
  onContainerTouch(event: TouchEvent): void {
    if (!this.controller.getActiveVideo().duration) {
      // Can't play yet.  Ignore.
      return;
    }

    if (this.isOpaque()) {
      this.lastTouchEventTime_ = Date.now();
      // The controls are showing.
      // Let this event continue and become a click.
    } else {
      // The controls are hidden, so show them.
      this.onMouseMove(event);
      // Stop this event from becoming a click event.
      event.preventDefault();
    }
  }

  getWebRtcVideoContainer() {
    return this.webRtcContainer;
  }

  getControlsContainer() {
    return this.webRtcControlsContainer;
  }

  getBottomControlsContainer() {
    return this.webRtcBottomControlsContainer;
  }

  getControlsButtonPanel() {
    return this.webRtcControlsButtonPanel;
  }

  onMouseMove(event: MouseEvent | TouchEvent) {
    // Disable blue outline for focused elements for mouse navigation.
    if (event.type === 'mousemove') {
      this.computeOpacity();
    }
    if (
      event.type === 'touchstart' ||
      event.type === 'touchmove' ||
      event.type === 'touchend' ||
      event.type === 'keyup'
    ) {
      this.lastTouchEventTime_ = Date.now();
    } else if (
      this.lastTouchEventTime_ != null &&
      this.lastTouchEventTime_ + 1000 < Date.now()
    ) {
      // It has been a while since the last touch event, this is probably a real
      // mouse moving, so treat it like a mouse.
      this.lastTouchEventTime_ = null;
    }

    // When there is a touch, we can get a 'mousemove' event after touch events.
    // This should be treated as part of the touch, which has already been
    // handled.
    if (this.lastTouchEventTime_ && event.type === 'mousemove') {
      return;
    }

    // Use the cursor specified in the CSS file.
    this.webRtcContainer.style.cursor = '';

    this.recentMouseMovement_ = true;

    if (!this.isOpaque()) {
      // Only update the time and seek range on mouse movement if it's the very
      // first movement and we're about to show the controls.  Otherwise, the
      // seek bar will be updated much more rapidly during mouse movement.  Do
      // this right before making it visible.
      this.computeOpacity();
    }

    // Hide the cursor when the mouse stops moving.
    // Only applies while the cursor is over the video container.
    this.mouseStillTimer.stop();

    // Only start a timeout on 'touchend' or for 'mousemove' with no touch
    // events.
    if (
      event.type === 'touchend' ||
      event.type === 'keyup' ||
      !this.lastTouchEventTime_
    ) {
      this.mouseStillTimer.tickAfter(/* seconds= */ 3);
    }
  }

  isOpaque() {
    return this.webRtcControlsContainer.getAttribute('shown') != null;
  }

  computeOpacity() {
    const videoIsPaused = this.controller.getActiveVideo().paused;

    // Keep showing the controls if the ad or video is paused, there has been
    // recent mouse movement, we're in keyboard navigation, or one of a special
    // class of elements is hovered.
    if (videoIsPaused || this.recentMouseMovement_) {
      // Make sure the state is up-to-date before showing it.

      this.webRtcControlsContainer.setAttribute('shown', 'true');
      this.webRtcControlsContainer.style.opacity = '1';
      this.fadeControlsTimer_.stop();
    } else {
      this.fadeControlsTimer_.tickAfter(/* seconds= */ 0.125);
    }
  }
}
