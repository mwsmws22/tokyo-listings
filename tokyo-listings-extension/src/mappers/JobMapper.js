import RemoveArchivedListingsJob from '../jobs/RemoveArchivedListingsJob'
import UpdateSuumoBukkenUrlsJob from '../jobs/UpdateSuumoBukkenUrlsJob'
import HighlightSimilarListingsJob from '../jobs/HighlightSimilarListingsJob'
import FilterScrapeableResultsJob from '../jobs/FilterScrapeableResultsJob'
import ShowMoreListingsJob from '../jobs/ShowMoreListingsJob'

export default class JobMapper {
  static getJob(job, loader) {
    switch (job) {
      case 'RemoveArchivedListingsJob':
        return RemoveArchivedListingsJob
      case 'UpdateSuumoBukkenUrlsJob':
        return UpdateSuumoBukkenUrlsJob
      case 'HighlightSimilarListingsJob':
        return HighlightSimilarListingsJob
      case 'FilterScrapeableResultsJob':
        return FilterScrapeableResultsJob
      case 'ShowMoreListingsJob':
        return ShowMoreListingsJob
      default:
        return params => Promise.resolve(params)
  }
}
