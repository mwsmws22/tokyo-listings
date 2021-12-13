export default class RemoveArchivedListingsJob {

  constructor(scrapedElems) {
    this.scrapedElems = scrapedElems
    this.endpoint = "http://localhost:8082/api/listing/partialUrl/"
  }

  buildPayload() {
    return {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({partials: this.scrapedElems.flatMap(elem => elem.listings).map(l => l.key)})
    }
  }

  execute() {
    fetch(this.endpoint, this.buildPayload())
      .then(res => res.json())
      .then(out => {
        const remKeys = out.map(res => res.url.match(/detail\/(.*?)\//)[1])
        this.scrapedElems.forEach(elem => {
          const diff = elem.listings.filter(l => remKeys.includes(l.key))
          if (diff.length == elem.listings.length) {
            elem.propertyElem.remove()
          } else if (diff.length < elem.listings.length) {
            diff.forEach(l => l.listingElem.remove())
          }
        })
      })
      .catch(err => console.log(err))
  }

}
