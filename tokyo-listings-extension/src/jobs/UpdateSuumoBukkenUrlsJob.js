export default class UpdateSuumoBukkenUrlsJob {

  constructor(scrapedElems) {
    this.scrapedElems = scrapedElems
    this.endpoint = "http://localhost:8082/api/listing/suumoBukken/"
  }

  buildPayload() {
    return {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({urls: this.scrapedElems.map(l => l.url)})
    }
  }

  execute() {
    fetch(this.endpoint, this.buildPayload())
      .then(res => res.json())
      .then(out => {
        let updatedUrlSet = new Set()
        this.scrapedElems.forEach(l => {
          if (!updatedUrlSet.has(out[l.url])) {
            let linkElems = Array.from(l.listingElem.getElementsByTagName("a"))
            linkElems.forEach(a => a.setAttribute('href', out[l.url]))
            updatedUrlSet.add(out[l.url])
          } else {
            l.listingElem.remove()
          }
        })
      })
      .catch(err => console.log(err))
  }

}
