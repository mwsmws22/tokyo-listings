import JobUtils from '../utils/JobUtils.js'

export default class UpdateSuumoBukkenUrlsJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/suumoBukken/'

  static execute(scrapedElems) {
    return new Promise((resolve, reject) => {
      const urls = scrapedElems.map(l => l.listings[0].key)
      const payload = JobUtils.buildPayload(urls)
      fetch(this.ENDPOINT, payload)
        .then(res => res.json())
        .then(out => {
          let updatedUrlSet = new Set()
          resolve(
            scrapedElems.filter(l => {
              const url = out[l.listings[0].key]
              if (!updatedUrlSet.has(url)) {
                Array.from(l.propertyElem.getElementsByTagName('a')).forEach(a =>
                  a.setAttribute('href', url)
                )
                updatedUrlSet.add(url)
                l.listings[0].key = url
                return true
              } else {
                l.propertyElem.remove()
                return false
              }
            })
          )
        })
        .catch(err => console.log(err))
    })
  }
}
