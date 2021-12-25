import $ from "jquery"

export default class LoaderSuumoBukken {

  constructor() {
    this.params = ['update suumo bukken urls']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.querySelectorAll('tr.caseBukken'))
    const address = $("[class='bdLLGrayT bdLLGrayB pH10 pV5 lh14']")[0].innerText

    listings.forEach(tr =>
      this.scrapedElems.push({
        listingElem: tr,
        address: address,
        square_m: $(tr).find("[class='bdLLGrayL bdLLGrayT taC pH15 pV5 TF breakA']")[2].innerText.match(/^(.*?)平米/)[1],
        url: $(tr).find("[class='fs12 bld']")[0].href
      })
    )
  }

}
