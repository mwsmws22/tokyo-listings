export default class LoaderSumaityBukken {

  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.querySelector('table.floor_plan').children[0].children)
    let address = document.querySelector('table.buildingSummary').children[0].children[0].children[1].innerText
    address = address.remove('街レビューを見る').remove('周辺物件').noSpaces().remove('\n')

    listings.slice(1, listings.length).forEach(tr =>
      this.scrapedElems.push({
        propertyElem: tr,
        listings: [{
          listingElem: tr,
          address: address,
          key: tr.querySelector('div.estateDetailBtn').children[0].href.match(/prop_(.*?)\//)[1],
          square_m: tr.querySelector('td.area').innerText.remove("m2").float()
        }]
      })
    )
  }
}
