import JobUtils from '../utils/JobUtils'

export default class HighlightSimilarListingsJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/similarListings/'

  static execute(scrapedElems, params) {
    const paramObjs = this.constructParamObjs(scrapedElems, params)
    const payload = JobUtils.buildPayload(paramObjs)
    return new Promise((resolve, reject) => {
      fetch(this.ENDPOINT, payload)
        .then(res => res.json())
        .then(out => {
          scrapedElems.forEach(elem =>
            elem.listings.forEach(l =>
              out.forEach(o => {
                if (this.compareObjectParams(l, o)) {
                  l.listingElem.style.backgroundColor = 'lightyellow'
                }
              })
            )
          )
          resolve(scrapedElems)
        })
        .catch(err => reject(err))
    })
  }

  static constructParamObjs(scrapedElems, params) {
    const paramObjs = scrapedElems
      .map(elem =>
        elem.listings.map(l => {
          const kvPairs = params.map(p => [p, l[p]])
          return Object.fromEntries(kvPairs)
        })
      )
      .flat()

    return JobUtils.removeDupObjFromArray(paramObjs)
  }

  static compareObjectParams(listing, out) {
    if (listing.address) {
      out.address = JobUtils.buildAddress(
        out.property,
        4,
        listing.address.includes('丁目')
      )
      listing.address = listing.address.convertHalfWidth().jp()
    }

    const { key, listingElem, ...rest } = listing

    return Object.entries(rest).every(([kL, vL]) =>
      Object.entries(out).some(([kO, vO]) => kL === kO && vL === String(vO))
    )
  }
}
