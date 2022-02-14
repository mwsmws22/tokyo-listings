import JobUtils from '../utils/JobUtils'

export default class SumaityBukkenRedirectJob {
  static ENDPOINT = 'http://localhost:8082/api/listing/sumaityRedirect/'

  constructor() {
    this.url = SumaityBukkenRedirectJob.getFirstListingUrl()
  }

  static getFirstListingUrl() {
    const table = document.querySelector('table.floor_plan')
    return table
      ? table.children[0].children[1].querySelector('div.estateDetailBtn').children[0]
          .href
      : null
  }

  execute() {
    if (this.url) {
      const payload = JobUtils.buildPayload({ url: this.url })
      fetch(SumaityBukkenRedirectJob.ENDPOINT, payload)
        .then(res => res.json())
        .then(out => window.location.replace(out.bldgUrl))
        .catch(err => console.log(err))
    }
  }
}
