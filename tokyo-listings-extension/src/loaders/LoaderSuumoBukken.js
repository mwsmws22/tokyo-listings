import $ from 'jquery'

export default class LoaderSuumoBukken {
  constructor() {
    this.pipeline = [
      'update suumo bukken urls',
      'remove archived listings',
      'highlight similar listings'
    ]
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.querySelectorAll('tr.caseBukken'))
    const address = $(
      "[class='bdLLGrayT bdLLGrayB pH10 pV5 lh14']"
    )[0].innerText.noSpaces()

    listings.forEach(tr =>
      this.scrapedElems.push({
        propertyElem: tr,
        listings: [
          {
            listingElem: tr,
            address: address,
            square_m: $(tr)
              .find("[class='bdLLGrayL bdLLGrayT taC pH15 pV5 TF breakA']")[2]
              .innerText.match(/^(.*?)平米/)[1],
            key: $(tr).find("[class='fs12 bld']")[0].href
          }
        ]
      })
    )
  }
}
