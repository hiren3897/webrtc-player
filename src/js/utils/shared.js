/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and replace the Array if new is configured
 *
 * @param {...object} objects - Objects to merge
 * @returns {object} New object with merged key/values
 */
export function mergeDeep(...objects) {
  const isObject = (obj) => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = oVal;
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

export function getCurrentPosition(e, seekBar) {
  const seekBarRect = seekBar.getBoundingClientRect();
  const min = parseFloat(seekBar.min);
  const max = parseFloat(seekBar.max);

  const position = e.clientX - seekBarRect.left;
  const scale = (max - min) / seekBarRect.width;

  let realPosition = min + scale * position;
  if (realPosition < min) {
    realPosition = min;
  } else if (realPosition > max) {
    realPosition = max;
  }

  return realPosition;
}

/**
 * Builds a time string, e.g., 01:04:23, from |displayTime|.
 *
 * @param {number} displayTime (in seconds)
 * @param {boolean} showHour
 * @return {string}
 */
export function buildTimeString(displayTime, showHour) {
  const h = Math.floor(displayTime / 3600);
  const m = Math.floor((displayTime / 60) % 60);
  let s = Math.floor(displayTime % 60);
  if (s < 10) {
    s = '0' + s;
  }
  let text = m + ':' + s;
  if (showHour) {
    if (m < 10) {
      text = '0' + text;
    }
    text = h + ':' + text;
  }
  return text;
}

export const convertMsToSeconds = (ms) => {
  return ms / 1000;
};

export const parseWebSocketUri = (uri) => {
  let newUrl;
  if (uri.endsWith('/')) {
    newUrl = uri.replace(/^http/, 'ws') + 'ws';
    return newUrl;
  }
  newUrl = uri.replace(/^http/, 'ws') + '/ws';
  return newUrl;
};
