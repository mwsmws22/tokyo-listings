export default class LoaderSumaity {

  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementById('result').children)
                          .filter(div => div.className === 'building')

    listings.forEach(div =>
      this.scrapedElems.push({
        propertyElem: div,
        listings: Array.from(div.querySelectorAll('tr.estate.applicable')).map(tr => ({
          listingElem: tr,
          address: div.querySelector('.address').innerText,
          key: tr.querySelector('a.detailBtn').href.match(/prop_(.*?)\//)[1],
          square_m: tr.querySelector('td.type').children[1].innerText.replace("m2", "")
        }))
      })
    )
  }
}
