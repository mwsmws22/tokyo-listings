import JobUtils from '../utils/JobUtils'

export default class UpdateSuumoBukkenUrlsJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/suumoBukken/'

  static execute(scrapedElems) {
    const urls = scrapedElems.map(l => l.listings[0].key)
    const payload = JobUtils.buildPayload(urls)

    return fetch(this.ENDPOINT, payload)
      .then(res => res.json())
      .then(out => {
        const updatedUrlSet = new Set()
        return scrapedElems.flatMap(l => {
          const url = out[l.listings[0].key]
          if (!updatedUrlSet.has(url)) {
            Array.from(l.propertyElem.getElementsByTagName('a')).forEach(a =>
              a.setAttribute('href', url)
            )
            updatedUrlSet.add(url)
            l.listings[0].key = url
            return [l]
          }
          l.propertyElem.remove()
          return []
        })
      })
  }
}
