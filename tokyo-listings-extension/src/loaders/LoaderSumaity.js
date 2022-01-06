export default class LoaderSumaity {

  constructor() {
    this.pipeline = ['remove archived listings', 'remove distant stations', 'highlight similar listings']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementById('result').children)
                          .filter(div => div.className === 'building')

    listings.forEach(div =>
      this.scrapedElems.push({
        propertyElem: div,
        address: div.querySelector('.address').innerText,
        listings: Array.from(div.querySelectorAll('tr.estate.applicable')).map(tr => ({
          listingElem: tr,
          key: tr.querySelector('a.detailBtn').href.match(/prop_(.*?)\//)[1],
          square_m: tr.querySelector('td.type').children[1].innerText.replace("m2", "")
        }))
      })
    )
  }
}
