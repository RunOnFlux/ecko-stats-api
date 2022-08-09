export const extractDecimal = (num) => {
  if (num?.int) return Number(num.int);
  if (num?.decimal) return Number(num.decimal);
  else return Number(num);
};

export const extractTime = (timestamp) => {
  if (timestamp.time) return timestamp.time;
  if (timestamp.timep) return timestamp.timep;
  else return timestamp;
};
