export default class JobUtils {

  static SCRAPEABLE_SITES = new Set([
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

  static removeDupObjFromArray (array) {
    return Array.from(new Set(array.map(e => JSON.stringify(e)))).map(e => JSON.parse(e))
  }

  static buildPayload (body) {
    return {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  }
}
