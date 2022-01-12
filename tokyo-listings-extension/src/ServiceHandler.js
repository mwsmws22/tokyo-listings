import RemoveArchivedListingsJob from './jobs/RemoveArchivedListingsJob.js'
import UpdateSuumoBukkenUrlsJob from './jobs/UpdateSuumoBukkenUrlsJob.js'
import HighlightSimilarListingsJob from './jobs/HighlightSimilarListingsJob.js'
import FilterScrapeableResultsJob from './jobs/FilterScrapeableResultsJob.js'
import LoaderYahoo from './loaders/LoaderYahoo.js'
import LoaderRStore from './loaders/LoaderRStore.js'
import LoaderSumaity from './loaders/LoaderSumaity.js'
import LoaderSumaityBukken from './loaders/LoaderSumaityBukken.js'
import LoaderSuumo from './loaders/LoaderSuumo.js'
import LoaderSuumoBukken from './loaders/LoaderSuumoBukken.js'
import LoaderGoogle from './loaders/LoaderGoogle.js'
import StringUtils from './utils/StringUtils.js'

class ServiceHandler {

  constructor() {
    this.loader = this.loaderFactory(location.href)
    StringUtils.initialize()
  }

  loaderFactory(url) {
    if (url.includes('realestate.yahoo.co.jp/rent/search')) {
      return new LoaderYahoo()
    } else if (url.includes('sumaity.com/chintai/area_list')) {
      return new LoaderSumaity()
    } else if (url.includes('sumaity.com/chintai') && url.includes('bldg')) {
      return new LoaderSumaityBukken()
    } else if (url.includes('suumo.jp/jj/chintai/ichiran/FR301FC001')) {
      return new LoaderSuumo()
    } else if (url.includes('suumo.jp/library')) {
      return new LoaderSuumoBukken()
    } else if (url.includes('google.com/search')) {
      return new LoaderGoogle()
    } else if (url.includes('r-store.jp/search')) {
      return new LoaderRStore()
    }
  }

  execute() {
    this.loader?.execute()
    this.loader?.pipeline.map(job => {
      switch (job) {
        case 'remove archived listings':
          return (scrapedElems) => RemoveArchivedListingsJob.execute(scrapedElems)
        case 'update suumo bukken urls':
          return (scrapedElems) => UpdateSuumoBukkenUrlsJob.execute(scrapedElems)
        case 'highlight similar listings':
          return (scrapedElems) => HighlightSimilarListingsJob.execute(scrapedElems, this.loader.similarParams)
        case 'filter scrapeable results':
          return (scrapedElems) => FilterScrapeableResultsJob.execute(scrapedElems)
      }
    }).reduce((prev, curr) => {
      return prev.then(curr)
    }, Promise.resolve(this.loader.scrapedElems))
  }
}

const sh = new ServiceHandler()
sh.execute()
