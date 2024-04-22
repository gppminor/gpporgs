export const formatTime = (time: number) => {
  if (time == 0) return '-';
  const date = new Date(time);
  const padTo2Digits = (num: number) => {
    return num.toString().padStart(2, '0');
  };
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [padTo2Digits(date.getHours()), padTo2Digits(date.getMinutes())].join(':')
  );
};
