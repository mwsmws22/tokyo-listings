import RemoveArchivedListingsJob from './jobs/RemoveArchivedListingsJob'
import UpdateSuumoBukkenUrlsJob from './jobs/UpdateSuumoBukkenUrlsJob'
import HighlightSimilarListingsJob from './jobs/HighlightSimilarListingsJob'
import FilterScrapeableResultsJob from './jobs/FilterScrapeableResultsJob'
import ShowMoreListingsJob from './jobs/ShowMoreListingsJob'
import LoaderYahoo from './loaders/LoaderYahoo'
import LoaderRStore from './loaders/LoaderRStore'
import LoaderSumaity from './loaders/LoaderSumaity'
import LoaderSumaityBukken from './loaders/LoaderSumaityBukken'
import LoaderSuumo from './loaders/LoaderSuumo'
import LoaderSuumoBukken from './loaders/LoaderSuumoBukken'
import LoaderGoogle from './loaders/LoaderGoogle'

export default class ServiceHandler {
  constructor() {
    this.loaderFactory(window.location.href)
  }

  loaderFactory(url) {
    if (url.includes('realestate.yahoo.co.jp/rent/search')) {
      this.loader = new LoaderYahoo()
    } else if (url.includes('sumaity.com/chintai/area_list')) {
      this.loader = new LoaderSumaity()
    } else if (url.includes('sumaity.com/chintai') && url.includes('bldg')) {
      this.loader = new LoaderSumaityBukken()
    } else if (url.includes('suumo.jp/jj/chintai/ichiran/FR301FC001')) {
      this.loader = new LoaderSuumo()
    } else if (url.includes('suumo.jp/library')) {
      this.loader = new LoaderSuumoBukken()
    } else if (url.includes('google.com/search')) {
      this.loader = new LoaderGoogle()
    } else if (url.includes('r-store.jp/search')) {
      this.loader = new LoaderRStore()
    }
  }

  execute() {
    this.loader?.execute()
    this.loader?.pipeline
      .map(job => {
        switch (job) {
          case 'remove archived listings':
            return scrapedElems => RemoveArchivedListingsJob.execute(scrapedElems)
          case 'update suumo bukken urls':
            return scrapedElems => UpdateSuumoBukkenUrlsJob.execute(scrapedElems)
          case 'highlight similar listings':
            return scrapedElems =>
              HighlightSimilarListingsJob.execute(scrapedElems, this.loader.similarParams)
          case 'filter scrapeable results':
            return scrapedElems => FilterScrapeableResultsJob.execute(scrapedElems)
          case 'show more listings':
            return scrapedElems =>
              ShowMoreListingsJob.execute(scrapedElems, this.loader.showMoreButton)
          default:
            return scrapedElems => Promise.resolve(scrapedElems)
        }
      })
      .reduce((prev, curr) => prev.then(curr), Promise.resolve(this.loader.scrapedElems))
      .catch(err => console.log(err))
  }
}
