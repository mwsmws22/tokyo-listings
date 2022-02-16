export default class LoaderRealTokyoEstate {
  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(
      document.getElementsByName('searchresulcontrol')[0].c(0, 0).children
    )

    const filteredListings = listings.filter(tr => tr.c(0, 0)?.href)

    filteredListings.forEach(tr =>
      this.scrapedElems.push({
        propertyElem: tr,
        listings: [
          {
            listingElem: tr,
            key: tr.c(0, 0).href,
            square_m: tr
              .c(0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0)
              .innerText.match(/\/\s(.*?)$/)[1]
              .remove('㎡')
              .split('～'),
            address: tr.c(0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0).innerText
          }
        ]
      })
    )
  }
}
