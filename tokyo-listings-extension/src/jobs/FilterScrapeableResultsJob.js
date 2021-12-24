export default class FilterScrapeableResultsJob {

  constructor(searchResults) {
    this.searchResults = searchResults
    this.scrapeableSites = new Set([
      'www.athome.co.jp',
      'suumo.jp',
      'realestate.yahoo.co.jp',
      'www.realtokyoestate.co.jp',
      'tokyo-style.cc',
      'www.aeras-group.jp',
      'www.rehouse.co.jp',
      'www.renov-depart.jp',
      'www.chintai.net',
      'www.omusubi-estate.com',
      'www.r-store.jp',
      'www.tatodesign.jp',
      'www.goodrooms.jp',
      'www.homes.co.jp',
      'joylifestyle.jp',
      'www.diyp.jp',
      'www.pethomeweb.com',
      'xn--ihqxo86hrls96efnv.com',
      'tomigaya.jp',
      'tokyo-designers.com',
      'east-and-west.jp',
      'www.sousaku-kukan.com',
      'aoyama-fudousan.com',
      'kagurazaka-fudousan.com',
      'www.jkhome.com',
      'kodate.chintaistyle.jp',
      'house.asocio.co.jp',
      'house.goo.ne.jp',
      'spacelist.jp',
      'housestokyo.jp',
      'sumaity.com',
      'www.kencorp.co.jp',
      'www.bestexnet.co.jp',
      'smocca.jp',
      'www.axel-home.com',
      'chintai-ex.jp',
      'www.hatomarksite.com',
      'www.century21.jp',
      'house.ocn.ne.jp',
      'www.oasis-estate.jp'
    ])
  }

  execute() {
    this.searchResults.forEach(sr => {
      if (sr.hostnames.size == 1) {
        if (!this.scrapeableSites.has(Array.from(sr.hostnames).pop())) {
          sr.searchResultElem.remove()
        }
      } else {
        console.log("Issue with hostnames length")
        console.log(sr)
      }
    })
  }

}
