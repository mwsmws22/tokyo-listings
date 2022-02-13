import JobUtils from '../utils/JobUtils'

export default class HighlightSimilarListingsJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/similarListings/'

  static execute(scrapedElems, params) {
    const paramObjs = this.constructParamObjs(scrapedElems, params)
    const payload = JobUtils.buildPayload(paramObjs)

    return fetch(this.ENDPOINT, payload)
      .then(async res => {
        const data = await res.json()
        return { data, status: res.status }
      })
      .then(res => {
        if (res.status !== 200) {
          throw new Error(res.data.message)
        } else {
          return res.data
        }
      })
      .then(out =>
        scrapedElems.flatMap(elem =>
          elem.listings.flatMap(l => {
            const matches = out.filter(o => this.compareObjectParams(l, o))
            if (matches.length) {
              l.listingElem.setAttribute('style', 'background-color: lightyellow')
              return { listing: l, matches }
            }
            return []
          })
        )
      )
      .then(matches => {
        this.logHighlightedListings(matches)
        return scrapedElems
      })
  }

  static logHighlightedListings(allMatches) {
    console.log('the following listings were highlighted')
    console.log(allMatches)
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
      const districtKanji = listing.address.includes('丁目')
      out.address = JobUtils.buildAddress(out.property, 4, districtKanji)
      listing.address = listing.address.convertHalfWidth().jp()
    }

    const { key, listingElem, ...rest } = listing

    return Object.entries(rest).every(([kL, vL]) =>
      Object.entries(out).some(([kO, vO]) => kL === kO && vL === String(vO))
    )
  }
}
