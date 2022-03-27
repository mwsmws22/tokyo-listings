Array.prototype.last = function last() {
  if (this.length > 0) {
    return this[this.length - 1]
  }
  return null
}
