export default class LoaderYahoo {
  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const properties = Array.from(document.getElementById('listBuilding').children)

    properties.forEach(div => {
      const buildData = div.querySelector('div.buildData')
      const listings = Array.from(div.querySelector('ul.roomList').children)

      this.scrapedElems.push({
        propertyElem: div,
        listings: listings.map(li => ({
          listingElem: li,
          address: buildData.children[1].children[1].innerText,
          key: li.querySelector('input.ignorePropertyClick').value,
          square_m: li.querySelector('p.floorplan').innerText.match(/\n(.*?)m2/)[1]
        }))
      })
    })
  }
}
