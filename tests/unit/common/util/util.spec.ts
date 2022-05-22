import { validateArrayHasElements } from '../../../../src/common/util';

describe('util', function () {
  describe('#validateArrayHasElements', function () {
    it('should return boolean value for given array has any elements in it', function () {
      expect(validateArrayHasElements(undefined)).toBeFalsy();
      const array: unknown[] = [];
      expect(validateArrayHasElements(array)).toBeFalsy();
      array.push({});
      expect(validateArrayHasElements(array)).toBeTruthy();
      array.pop();
      expect(validateArrayHasElements(array)).toBeFalsy();
    });
  });
});
