export default class LoaderRStore {

  constructor() {
    this.pipeline = ['remove archived listings']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementsByClassName('section-list')[0].children)

    listings.forEach(div =>
      this.scrapedElems.push({
        propertyElem: div,
        listings: [{
          listingElem: div,
          key: div.children[0].href.match(/room\/(.*?)$/)[1],
          square_m: div.querySelector('.spec-area').innerText.replace("㎡", "")
        }]
      })
    )
  }
}
