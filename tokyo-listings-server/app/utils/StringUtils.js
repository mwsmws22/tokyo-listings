module.exports = class StringUtils {

  static convertHalfWidth() {
    return this.replace(/[\uff01-\uff5e]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
  }

  static noSpaces() {
    return this.replace(/\s/g, '')
  }

  static initialize() {
    String.prototype.convertHalfWidth = this.convertHalfWidth
    String.prototype.noSpaces = this.noSpaces
    return
  }
}
