import RemoveArchivedListingsJob from './jobs/RemoveArchivedListingsJob.js'
import UpdateSuumoBukkenUrlsJob from './jobs/UpdateSuumoBukkenUrlsJob.js'
import HighlightSimilarListingsJob from './jobs/HighlightSimilarListingsJob.js'
import FilterScrapeableResultsJob from './jobs/FilterScrapeableResultsJob.js'
import LoaderYahoo from './loaders/LoaderYahoo.js'
import LoaderSuumo from './loaders/LoaderSuumo.js'
import LoaderSuumoBukken from './loaders/LoaderSuumoBukken.js'
import LoaderGoogle from './loaders/LoaderGoogle.js'

class ServiceHandler {

  constructor() {
    this.loader = this.loaderFactory(location.href)
  }

  loaderFactory(url) {
    if (url.includes('realestate.yahoo.co.jp/rent/search')) {
      return new LoaderYahoo()
    } else if (url.includes('suumo.jp/jj/chintai/ichiran/FR301FC001')) {
      return new LoaderSuumo()
    } else if (url.includes('suumo.jp/library')) {
      return new LoaderSuumoBukken()
    } else if (url.includes('google.com/search')) {
      return new LoaderGoogle()
    }
  }

  execute() {
    this.loader?.execute()
    this.loader?.params.forEach(param => {
      switch (param) {
        case 'remove archived listings':
          return new RemoveArchivedListingsJob(this.loader.scrapedElems).execute()
        case 'update suumo bukken urls':
          return new UpdateSuumoBukkenUrlsJob(this.loader.scrapedElems).execute()
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
