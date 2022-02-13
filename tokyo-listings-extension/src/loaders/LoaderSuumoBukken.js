import $ from 'jquery'

export default class LoaderSuumoBukken {
  constructor() {
    this.pipeline = [
      'show more listings',
      'update suumo bukken urls',
      'remove archived listings',
      'highlight similar listings'
    ]
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    LoaderSuumoBukken.removeForSaleListings()

    const listings = Array.from(document.querySelectorAll('tr.caseBukken'))
    const addressObj = $("[class='bdLLGrayT bdLLGrayB pH10 pV5 lh14']")[0]
    const address = addressObj.innerText.remove(' ')

    this.showMoreButton = document.getElementById('naviChintai')

    listings.forEach(tr =>
      this.scrapedElems.push({
        propertyElem: tr,
        listings: [
          {
            listingElem: tr,
            address,
            square_m: $(tr)
              .find("[class='bdLLGrayL bdLLGrayT taC pH15 pV5 TF breakA']")[2]
              .innerText.match(/^(.*?)平米/)[1],
            key: $(tr).find("[class='fs12 bld']")[0].href
          }
        ]
      })
    )
  }

  static removeForSaleListings() {
    const forSaleHeader = document.querySelector('h3[id=chuMS]')
    if (forSaleHeader) {
      forSaleHeader.nextElementSibling.nextElementSibling.remove()
      forSaleHeader.nextElementSibling.remove()
      forSaleHeader.remove()
    }
  }
}
