import { WebRTCVideoElement } from '../ui/interfaces';

/**
 * Creates an element, and cast the type from Element to HTMLElement.
 *
 * @param {string} tagName
 * @return {!HTMLElement}
 */
export const createHTMLElement = (tagName: string): HTMLElement => {
  /** @type {!HTMLElement} */
  return document.createElement(tagName);
};

/**
 * Create a "button" element with the correct type.
 * @return {!HTMLButtonElement}
 */
export const createButton = (): HTMLButtonElement => {
  /** @type {!HTMLButtonElement} */
  return document.createElement('button');
};

/**
 * Remove all of the child nodes of an element.
 * @param {!Element} element
 * @export
 */
export const removeAllChildren = (element: Element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

/**
 * Append Child Element in parent element
 * @param {!HTMLElement} parent
 * @param {!HTMLElement} element
 * @export
 */
export const appendChildElement = (
  parent: HTMLElement,
  element: HTMLElement,
) => {
  parent.appendChild(element);
};

/**
 * Returns all child elements.
 * @param tagName
 * @return {NodeListOf<Element>}
 */
export const getAllChildElements = (tagName: string) => {
  return document.querySelectorAll(`${tagName}`);
};

export const createHlsVideoElement = (
  mainVideoElement: WebRTCVideoElement,
): HTMLVideoElement => {
  const videoEl = createHTMLElement('video') as HTMLVideoElement;
  videoEl.id = 'videoHls';
  videoEl.classList.add('webrtc-video');
  videoEl.classList.add('flux-layer');
  videoEl.classList.add('dvr-layer');

  mainVideoElement.insertAdjacentElement('afterend', videoEl);
  return videoEl;
};
