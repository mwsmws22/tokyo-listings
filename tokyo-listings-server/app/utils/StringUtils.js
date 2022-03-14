String.prototype.convertHalfWidth = function convertHalfWidth() {
  return this.replace(/[\uff01-\uff5e]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  )
}

String.prototype.escape = function escape() {
  return JSON.stringify(this)
}

String.prototype.float = function float() {
  return String(parseFloat(this))
}

String.prototype.noSpaces = function noSpaces() {
  return this.replace(/\s/g, '')
}

String.prototype.remove = function remove(...args) {
  const reduceFunc = (prev, curr) => prev.replace(new RegExp(curr, 'g'), '')
  return args.reduce(reduceFunc, this)
}

String.prototype.toManen = function toManen() {
  return parseInt(this) / 10000
}

String.prototype.fileName = function fileName() {
  return this.split('/').pop()
}

// standardizes a few specific japanese characters
String.prototype.jp = function jp() {
  return this.replace(/ヶ/g, 'ケ').replace(/ノ/g, '之')
}

// reverse of the jp() function
String.prototype.reverseJp = function reverseJp() {
  return this.replace(/ケ/g, 'ヶ').replace(/之/g, 'ノ')
}
