export const validateArrayIsNotEmpty = <T>(array: T[] | undefined): boolean => {
  return array?.length !== 0;
};
