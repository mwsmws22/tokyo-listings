import $ from 'jquery'

export default class LoaderSuumoBukken {
  constructor() {
    this.pipeline = [
      'ShowMoreListingsJob'
      'UpdateSuumoBukkenUrlsJob',
      'RemoveArchivedListingsJob',
      'HighlightSimilarListingsJob'
    ]
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
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
}
