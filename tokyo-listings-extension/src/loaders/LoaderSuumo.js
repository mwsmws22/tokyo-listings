export default class LoaderSuumo {

  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.scrapedElems = []
  }

  execute() {
    const listings = Array.from(document.getElementById('js-bukkenList').children)
                          .filter(div => div.tagName === 'UL')
                          .flatMap(ul => Array.from(ul.children))

    listings.forEach(li =>
      this.scrapedElems.push({
        propertyElem: li,
        listings: Array.from(li.querySelectorAll('tbody')).map(tb => ({
          listingElem: tb,
          address: li.querySelector('.cassetteitem_detail-col1').innerText,
          key: tb.querySelector('.js-cassette_link_href').href.match(/jnc_(.*?)\//)[1],
          square_m: tb.querySelector('.cassetteitem_menseki').innerText.replace("m2","")
        }))
      })
    )
  }
}
