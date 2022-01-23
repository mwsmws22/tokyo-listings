import JobUtils from '../utils/JobUtils'

export default class FilterScrapeableResultsJob {
  static execute(scrapedElems) {
    return new Promise((resolve, reject) => {
      scrapedElems.forEach(elem => {
        if (elem.hostnames.size === 1) {
          const host = Array.from(elem.hostnames).pop()
          if (!JobUtils.SCRAPEABLE_SITES.has(host)) {
            elem.searchResultElem.remove()
          }
        } else {
          reject(new Error(`Issue with hostnames length. Element:\n${elem}`))
        }
      })
      resolve(scrapedElems)
    })
  }
}
