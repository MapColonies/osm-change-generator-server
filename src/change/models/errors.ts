export class ParseOsmElementsError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ParseOsmElementsError.prototype);
  }
}
