import JobUtils from '../utils/JobUtils.js'

export default class HighlightSimilarListingsJob {

  static ENDPOINT = "http://localhost:8082/api/listing/similarListings/"

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
                if (this.compareObjectParams(l,o)) {
                  l.listingElem.style.backgroundColor = "lightyellow"
                }
              })  
            )
          )
          resolve(scrapedElems)
        })
        .catch(err => console.log(err))
    })
  }

  static constructParamObjs(scrapedElems, params) {
    const paramObjs = scrapedElems.map(elem => {
      elem.listings.map(l => {
        const kvPairs = params.map(p => ([p, l[p]]))
        return Object.fromEntries(kvPairs)
      })
    }).flat()

    return JobUtils.removeDupObjFromArray(paramObjs)
  }

  static compareObjectParams(listing, out) {
    //LAST PART!!!!
    if (out.some(o => o.address == elem.address && o.square_m == l.square_m)) {
      l.listingElem.style.backgroundColor = "lightyellow"
    }
  }
}
