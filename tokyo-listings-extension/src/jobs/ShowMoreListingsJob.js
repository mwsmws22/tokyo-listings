export default class ShowMoreListingsJob {
  static execute(scrapedElems, button) {
    button?.click()
    return new Promise(resolve => {
      resolve(scrapedElems)
    })
  }
}
