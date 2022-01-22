import JobUtils from '../utils/JobUtils.js'

export default class RemoveArchivedListingsJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/partialUrl/'

  static execute(scrapedElems) {
    return new Promise((resolve, reject) => {
      const keys = scrapedElems.flatMap(elem => elem.listings).map(l => l.key)
      const payload = JobUtils.buildPayload(keys)
      fetch(this.ENDPOINT, payload)
        .then(res => res.json())
        .then(out => {
          const urls = out.map(res => res.url)
          const filteredElems = scrapedElems.filter(elem => {
            const hits = elem.listings.filter(l => urls.some(url => url.includes(l.key)))
            const nonHits = elem.listings.filter(
              l => !urls.some(url => url.includes(l.key))
            )
            if (hits.length == elem.listings.length) {
              elem.propertyElem.remove()
              return false
            } else if (nonHits.length == elem.listings.length) {
              return true
            } else {
              hits.forEach(l => l.listingElem.remove())
              elem.listings = nonHits
              return true
            }
          })
          this.logRemovedListings(scrapedElems, filteredElems)
          resolve(filteredElems)
        })
        .catch(err => console.log(err))
    })
  }

  static logRemovedListings(originalElems, scrapedElems) {
    console.log('the following listings were removed')
    let missingListings = []
    originalElems.forEach(elem => {
      elem.listings.forEach(listing => {
        let missingListing = !scrapedElems.some(se =>
          se.listings.some(l => l.key == listing.key)
        )
        if (missingListing) {
          missingListings.push(listing)
        }
      })
    })
    console.log(missingListings)
    return
  }
}
