export default class HTMLElementUtils {
  // shorthand function for getting child nodes
  static c(...args) {
    const reduceFunc = (prev, curr) => prev.children[curr]
    return args.reduce(reduceFunc, this)
  }

  static initialize() {
    HTMLElement.prototype.c = this.c
  }
}
