/**
 * Zero-dependency relative time formatter using native browser V8 APIs.
 * Eliminates need for date-fns for maximum rendering performance.
 * @param {string|Date} dateString 
 * @returns {string} e.g. "2 minutes ago", "in 5 seconds"
 */
export const timeAgo = (dateString) => {
    if (!dateString) return '';
    const time = new Date(dateString).getTime();
    if (isNaN(time)) return '';

    const diffInSeconds = Math.floor((time - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second');
    if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
    if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
    return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
};
