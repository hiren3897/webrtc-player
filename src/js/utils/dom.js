/**
 * Creates an element, and cast the type from Element to HTMLElement.
 *
 * @param {string} tagName
 * @return {!HTMLElement}
 */
export const createHTMLElement = (tagName) => {
  /** @type {!HTMLElement} */
  return document.createElement(tagName);
};

/**
 * Create a "button" element with the correct type.
 * @return {!HTMLButtonElement}
 */
export const createButton = () => {
  /** @type {!HTMLButtonElement} */
  return document.createElement('button');
};

/**
 * Remove all of the child nodes of an element.
 * @param {!Element} element
 * @export
 */
export const removeAllChildren = (element) => {
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
export const appendChildElement = (parent, element) => {
  parent.appendChild(element);
};

/**
 * Returns all child elements.
 * @param tagName
 * @return {NodeListOf<Element>}
 */
export const getAllChildElements = (tagName) => {
  return document.querySelectorAll(`${tagName}`);
};
