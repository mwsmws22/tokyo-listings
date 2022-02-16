export default class LoaderAtHome {
  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const properties = Array.from(
      document.querySelectorAll('.p-property,.p-property--building,.js-block')
    )

    properties.forEach(div =>
      this.scrapedElems.push({
        propertyElem: div,
        listings: Array.from(div.querySelectorAll('.p-property__room--detailbox')).map(
          divv => ({
            listingElem: divv,
            address: div.querySelector('dl.p-property__information-hint').c(1).innerText,
            key: divv.c(1, 0).href.match(/chintai\/(.*?)\/\?/)[1],
            square_m: divv
              .querySelector('li.p-property__room-floorplan')
              .c(1)
              .innerText.remove('m²')
          })
        )
      })
    )
  }
}
