export const formatTime = (time: number): string => {
  if (!time) return '-';
  const now = Date.now();
  const date = new Date(time);
  const days = (now - time) / (1000 * 3600 * 24);
  if (days <= 1) return `Today ${timeString(date)}`;
  if (days <= 2) return `Yesterday ${timeString(date)}`;
  if (days <= 7) return 'This week';
  if (days <= 30) return 'This month';
  if (days <= 60) return 'Last month';
  if (days <= 365) return 'This year';
  if (days < 730) return 'Last year';
  return 'More than a year ago';
};

const timeString = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  return date.toLocaleTimeString('en-US', options);
};
