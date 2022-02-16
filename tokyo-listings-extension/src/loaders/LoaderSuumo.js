export default class LoaderSuumo {
  constructor() {
    this.pipeline = ['remove archived listings', 'highlight similar listings']
    this.similarParams = ['address', 'square_m']
    this.scrapedElems = []
  }

  execute() {
    const uls = Array.from(document.getElementById('js-bukkenList').children).filter(
      elem => (elem.tagName === 'UL' ? elem : elem.remove())
    )

    const containerUl = uls[0]

    uls.slice(1).forEach(ul => {
      Array.from(ul.children).forEach(div => containerUl.appendChild(div))
      ul.remove()
    })

    Array.from(containerUl.children).forEach(li =>
      this.scrapedElems.push({
        propertyElem: li,
        listings: Array.from(li.querySelectorAll('tbody')).map(tb => ({
          listingElem: tb,
          address: li.querySelector('.cassetteitem_detail-col1').innerText,
          key: tb.querySelector('.js-cassette_link_href').href.match(/jnc_(.*?)\//)[1],
          square_m: tb.querySelector('.cassetteitem_menseki').innerText.remove('m2')
        }))
      })
    )
  }
}
