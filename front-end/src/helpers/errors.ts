export class MyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MyError";
  }
}
