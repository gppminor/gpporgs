const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const timeString = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  return date.toLocaleTimeString('en-US', options);
};

export const formatTime = (time: number): string => {
  if (!time) return '-';
  const now = new Date();
  const date = new Date(time);
  const days = Math.floor((now.getTime() - time) / (1000 * 60 * 60 * 24));
  if (days == 0 && date.getHours() >= 0 && date.getMinutes() >= 0)
    return `Today ${timeString(date)}`;
  if (days == 1 && date.getHours() < now.getHours())
    return `Yesterday ${timeString(date)}`;
  if (days < 7) return `${daysOfWeek[date.getDay()]} ${timeString(date)}`;
  if (days < 14) return 'Last week';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return 'Last month';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  if (days < 730) return 'Last year';
  return `${Math.floor(days / 365)} years ago`;
};

export const valueChanged = (o: any, c: any) => {
  if (o != null && o != '' && typeof c != typeof o) return true;
  else if (c instanceof Array) {
    if (c.length !== o.length) return true;
    o.sort();
    c.sort();
    for (let i = 0; i < c.length; i++)
      if (valueChanged(o[i], c[i])) return true;
  } else if (c instanceof Object) {
    for (const key of Object.keys(c))
      if (valueChanged(o[key], c[key])) return true;
  } else if ((c == null || c == '') != (o == null || o == '')) return true;
  else if (o != null && o != '' && o != c) return true;

  return false;
};
