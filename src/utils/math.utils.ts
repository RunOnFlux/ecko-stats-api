export const getPercentage = (arg0: number, arg1: number): number => {
  try {
    return ((arg1 - arg0) / arg0) * 100;
  } catch (error) {
    return 0;
  }
};
