export default class LoaderYahoo {

  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementById('listBuilding').children)

    listings.forEach(div => {
      const buildData = div.querySelector('div.buildData')
      const listings = Array.from(div.querySelector('ul.roomList').children)

      this.scrapedElems.push({
        propertyElem: div,
        address: buildData.children[1].children[1].innerText,
        stations: buildData.children[0].children[1].innerText,
        listings: listings.map(li => ({
          listingElem: li,
          key: li.querySelector('input.ignorePropertyClick').value,
          square_m: li.querySelector('p.floorplan').innerText.match(/\n(.*?)m2/)[1]
        }))
      })
    })
  }
}
