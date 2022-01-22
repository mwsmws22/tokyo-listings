module.exports = class StringUtils {
  static convertHalfWidth() {
    return this.replace(/[\uff01-\uff5e]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
  }

  static noSpaces() {
    return this.replace(/\s/g, '')
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

  static escape() {
    return JSON.stringify(this)
  }

  static initialize() {
    String.prototype.convertHalfWidth = this.convertHalfWidth
    String.prototype.noSpaces = this.noSpaces
    String.prototype.remove = this.remove
    String.prototype.float = this.float
    String.prototype.toManen = this.toManen
    String.prototype.escape = this.escape
    return
  }
}
