import JobUtils from '../utils/JobUtils'

export default class RemoveArchivedListingsJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/partialUrl/'

  static execute(scrapedElems) {
    const keys = scrapedElems.flatMap(elem => elem.listings).map(l => l.key)
    const payload = JobUtils.buildPayload(keys)
    console.log(scrapedElems)
    console.log(payload)
    return fetch(this.ENDPOINT, payload)
      .then(res => res.json())
      .then(out => {
        console.log(out)
        const urls = out.map(res => res.url)
        return scrapedElems.flatMap(elem => {
          const hits = elem.listings.filter(l => urls.some(url => url.includes(l.key)))
          const nonHits = elem.listings.filter(
            l => !urls.some(url => url.includes(l.key))
          )
          if (hits.length === elem.listings.length) {
            elem.propertyElem.remove()
            return []
          }
          if (nonHits.length === elem.listings.length) {
            return [elem]
          }
          hits.forEach(l => l.listingElem.remove())
          elem.listings = nonHits
          return [elem]
        })
      })
      .then(filteredElems => {
        this.logRemovedListings(scrapedElems, filteredElems)
        return filteredElems
      })
  }

  static logRemovedListings(scrapedElems, filteredElems) {
    console.log('the following listings were removed')
    const missingListings = scrapedElems.flatMap(elem =>
      elem.listings.filter(
        listing => !filteredElems.some(fe => fe.listings.some(l => l.key === listing.key))
      )
    )
    console.log(missingListings)
  }
}
