module.exports = class Utils {
  static parseAddress(address) {
    const japa = require('jp-address-parser')
    const prefectures = ['東京都', '埼玉県', '神奈川県', '千葉県']
    const mappings = {
      prefecture: 'prefecture',
      city: 'municipality',
      town: 'town',
      chome: 'district',
      ban: 'block',
      go: 'house_number'
    }

    const mapper = (res, resolve) => {
      let prop = {}

      Object.entries(mappings).forEach(([k, v]) => {
        if (res[k]) {
          prop[v] = res[k]
        }
      })

      if (!prop.house_number && res.left?.startsWith('‐')) {
        prop.house_number = parseInt(res.left.replace('‐', ''))
      }

      resolve(prop)
    }

    return new Promise((resolve, reject) => {
      if (prefectures.some(p => address.startsWith(p))) {
        japa
          .parse(address)
          .then(res => mapper(res, resolve))
          .catch(failed => reject('unable to parse address'))
      } else {
        prefectures
          .map(p => () => japa.parse(p + address))
          .reduce((prev, curr) => prev.catch(curr), Promise.reject())
          .then(res => mapper(res, resolve))
          .catch(failed => reject('unable to parse address'))
      }
    })
  }

  static updateFields(obj1, obj2) {
    Object.entries(obj2).forEach(([k, v]) => {
      if (k in obj1) {
        obj1[k] = v
      }
    })
    return obj1
  }
}
