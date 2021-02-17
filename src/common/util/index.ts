export const validateArrayHasElements = <T>(array: T[] | undefined): boolean => {
  if (array === undefined) {
    return false;
  }
  return array.length > 0;
};
