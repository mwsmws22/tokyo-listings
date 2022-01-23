export default class StringUtils {
  static convertHalfWidth() {
    return this.replace(/[\uff01-\uff5e]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
  }

  // standardizes a few specific japanese characters
  static jp() {
    return this.replace(/ヶ/g, 'ケ').replace(/ノ/g, '之')
  }

  static remove(...args) {
    const reduceFunc = (prev, curr) => prev.replace(new RegExp(curr, 'g'), '')
    return args.reduce(reduceFunc, this)
  }

  static float() {
    return String(parseFloat(this))
  }

  static initialize() {
    String.prototype.convertHalfWidth = this.convertHalfWidth
    String.prototype.jp = this.jp
    String.prototype.remove = this.remove
    String.prototype.float = this.float
  }
}
