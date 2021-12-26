export default class LoaderYahoo {

  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementById('listBuilding').children)

    listings.forEach(div =>
      this.scrapedElems.push({
        propertyElem: div,
        address: div.children[0].children[2].children[1].children[1].innerText,
        listings: Array.from(div.children[0].children[4].children).map(li => ({
          listingElem: li,
          key: li.children[0].children[0].children[0].value,
          square_m: li.children[5].innerText.match(/\n(.*?)m2/)[1]
        }))
      })
    )
  }
}
