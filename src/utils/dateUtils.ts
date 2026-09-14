const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatShortDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < MINUTE) {
    return 'Edited just now';
  }
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `Edited ${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `Edited ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    if (days === 1) {
      return 'Edited yesterday';
    }
    return `Edited ${days} days ago`;
  }
  return `Edited ${formatShortDate(timestamp)}`;
}
