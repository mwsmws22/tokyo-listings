export default class HighlightSimilarListingsJob {

  constructor(scrapedElems) {
    this.scrapedElems = scrapedElems
    this.endpoint = "http://localhost:8082/api/listing/similarListings/"
  }

  removeDupObjFromArray(array) {
    return Array.from(new Set(array.map(e => JSON.stringify(e)))).map(e => JSON.parse(e))
  }

  buildPayload() {
    const body = this.scrapedElems.map(elem => elem.listings.map(l => ({address: elem.address, square_m: l.square_m}))).flat()
    return {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({params: this.removeDupObjFromArray(body)})
    }
  }

  execute() {
    fetch(this.endpoint, this.buildPayload())
      .then(res => res.json())
      .then(out => {
        this.scrapedElems.forEach(elem => {
          elem.listings.forEach(l => {
            if (out.filter(o => o.address == elem.address && o.square_m == l.square_m).length > 0 ) {
              l.listingElem.style.backgroundColor = "lightyellow"
            }
          })
        })
      })
      .catch(err => console.log(err))
  }

}
