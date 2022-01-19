module.exports = class StringUtils {

  static convertHalfWidth() {
    return this.replace(/[\uff01-\uff5e]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
  }

  static noSpaces() {
    return this.remove(' ')
  }

  static remove(...args) {
    const reduceFunc = (prev, curr) => prev.replace(new RegExp(curr, 'g'), '')
    return args.reduce(reduceFunc, this)
  }

  static float() {
    return String(parseFloat(this))
  }

  static toManen() {
    return parseInt(this) / 10000
  }

  static initialize() {
    String.prototype.convertHalfWidth = this.convertHalfWidth
    String.prototype.noSpaces = this.noSpaces
    String.prototype.remove = this.remove
    String.prototype.float = this.float
    String.prototype.toManen = this.toManen
    return
  }
}
