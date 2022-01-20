export default class StringUtils {

  static convertHalfWidth() {
    return this.replace(/[\uff01-\uff5e]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
  }

  static noSpaces() {
    return this.remove(' ')
  }

  // standardizes a few specific japanese characters
  static jp() {
    return this.replace(/ヶ/g, 'ケ').replace(/ノ/g, '之')
  }

  static remove(s) {
    return this.replace(new RegExp(s, 'g'), '')
  }

  static float() {
    return String(parseFloat(this))
  }

  static initialize() {
    String.prototype.convertHalfWidth = this.convertHalfWidth
    String.prototype.jp = this.jp
    String.prototype.noSpaces = this.noSpaces
    String.prototype.remove = this.remove
    String.prototype.float = this.float
    return
  }
}
