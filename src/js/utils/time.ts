/**
 * Builds a time string (e.g. 01:04:23 or 1:02:03:04) from seconds.
 *
 * @param displayTime Time in seconds
 * @param showHour Whether to include hours (and days if present)
 */
export const buildTimeString = (
  displayTime: number,
  showHour: boolean,
): string => {
  const totalSeconds = Math.max(0, Math.floor(displayTime));

  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;

  if (!showHour) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(String(days));
    parts.push(String(hours).padStart(2, '0'));
  } else {
    parts.push(String(hours));
  }

  parts.push(
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  );

  return parts.join(':');
};
export function getSeekableRange(video: HTMLVideoElement) {
  const seekable = video.seekable;

  if (!seekable || seekable.length === 0) return null;

  // The 'Live' window is always the last range in the seekable object
  const index = seekable.length - 1;
  const start = seekable.start(index);
  const end = seekable.end(index);

  if (!isFinite(start) || !isFinite(end) || end - start <= 0) return null;
  return { start, end, duration: end - start };
}
