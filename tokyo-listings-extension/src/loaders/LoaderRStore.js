export default class LoaderRStore {

  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['closest_station', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementsByClassName('section-list')[0].children)

    listings.forEach(div =>
      this.scrapedElems.push({
        propertyElem: div,
        listings: [{
          listingElem: div,
          key: div.children[0].href.match(/room\/(.*?)$/)[1],
          square_m: div.querySelector('.spec-area').innerText.replace("㎡", ""),
          closest_station: div.querySelector('.room_title').innerText.match(/^(.*?)\s/)[1] + "駅"
        }]
      })
    )
  }
}
