import LoaderYahoo from './loaders/LoaderYahoo'
import LoaderRStore from './loaders/LoaderRStore'
import LoaderSumaity from './loaders/LoaderSumaity'
import LoaderSumaityBukken from './loaders/LoaderSumaityBukken'
import LoaderSuumo from './loaders/LoaderSuumo'
import LoaderSuumoBukken from './loaders/LoaderSuumoBukken'
import LoaderGoogle from './loaders/LoaderGoogle'
import JobMapper from './mappers/JobMapper.js'

export default class ServiceHandler {
  constructor() {
    this.loaderFactory(window.location.href)
  }

  loaderFactory(url) {
    if (url.includes('realestate.yahoo.co.jp/rent/search')) {
      this.loader = new LoaderYahoo()
    }
    if (url.includes('sumaity.com/chintai/area_list')) {
      this.loader = new LoaderSumaity()
    }
    if (url.includes('sumaity.com/chintai') && url.includes('bldg')) {
      this.loader = new LoaderSumaityBukken()
    }
    if (url.includes('suumo.jp/jj/chintai/ichiran/FR301FC001')) {
      this.loader = new LoaderSuumo()
    }
    if (url.includes('suumo.jp/library')) {
      this.loader = new LoaderSuumoBukken()
    }
    if (url.includes('google.com/search')) {
      this.loader = new LoaderGoogle()
    }
    if (url.includes('r-store.jp/search')) {
      this.loader = new LoaderRStore()
    }
  }

  execute() {
    this.loader?.execute()
    this.loader?.pipeline
      .map(job => JobMapper.getJob(job))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve(this.loader.params))
      .catch(err => console.error(err))
  }
}
