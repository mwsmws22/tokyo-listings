import JobUtils from '../utils/JobUtils.js'

export default class HighlightSimilarListingsJob {

  static ENDPOINT = "http://localhost:8082/api/listing/similarListings/"

  static execute(scrapedElems) {
    let sqmAddressPairs = scrapedElems.map(elem => elem.listings.map(l => ({address: elem.address, square_m: l.square_m})))
    sqmAddressPairs = JobUtils.removeDupObjFromArray(sqmAddressPairs).flat()
    const payload = JobUtils.buildPayload(sqmAddressPairs)
    return new Promise((resolve, reject) => {
      fetch(this.ENDPOINT, payload)
        .then(res => res.json())
        .then(out => {
          scrapedElems.forEach(elem => {
            elem.listings.forEach(l => {
              if (out.some(o => o.address == elem.address && o.square_m == l.square_m)) {
                l.listingElem.style.backgroundColor = "lightyellow"
              }
            })
          })
          resolve(scrapedElems)
        })
        .catch(err => console.log(err))
    })
  }
}
