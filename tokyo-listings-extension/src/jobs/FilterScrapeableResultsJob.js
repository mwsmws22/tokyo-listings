import JobUtils from '../utils/JobUtils.js'

export default class FilterScrapeableResultsJob {
  static execute(scrapedElems) {
    return new Promise((resolve, reject) => {
      scrapedElems.forEach(elem => {
        if (elem.hostnames.size == 1) {
          const host = Array.from(elem.hostnames).pop()
          if (!JobUtils.SCRAPEABLE_SITES.has(host)) {
            elem.searchResultElem.remove()
          }
        } else {
          console.log('Issue with hostnames length')
          console.log(elem)
        }
      })
      resolve(scrapedElems)
    })
  }
}
