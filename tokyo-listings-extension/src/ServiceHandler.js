import RemoveArchivedListingsJob from './jobs/RemoveArchivedListingsJob.js'
import HighlightSimilarListingsJob from './jobs/HighlightSimilarListingsJob.js'
import FilterScrapeableResultsJob from './jobs/FilterScrapeableResultsJob.js'
import LoaderYahoo from './loaders/LoaderYahoo.js'
import LoaderGoogle from './loaders/LoaderGoogle.js'

class ServiceHandler {

  constructor() {
    this.loader = this.loaderFactory(location.href)
  }

  loaderFactory(url) {
    switch (new URL(url).hostname) {
      case 'realestate.yahoo.co.jp':
        return new LoaderYahoo()
      case 'www.google.com':
        return new LoaderGoogle()
      default:
        return null
    }
  }

  execute() {
    this.loader?.execute()
    this.loader?.params.forEach(param => {
      switch (param) {
        case 'remove archived listings':
          return new RemoveArchivedListingsJob(this.loader.scrapedElems).execute()  //weird
        case 'highlight similar listings':
          return new HighlightSimilarListingsJob(this.loader.scrapedElems).execute()
        case 'filter scrapeable results':
          return new FilterScrapeableResultsJob(this.loader.searchResults).execute()
      }
    })
  }

}

const sh = new ServiceHandler()
sh.execute()
