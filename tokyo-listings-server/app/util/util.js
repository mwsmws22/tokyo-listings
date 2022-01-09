const japa = require('jp-address-parser')

module.exports = {
  parseAddress: async function (address) {
    const prefectures = ['東京都', '千葉県', '神奈川県']
    const mappings = {
      'prefecture': 'prefecture',
      'city': 'municipality',
      'town': 'town',
      'chome': 'district',
      'ban': 'block',
      'go': 'house_number'
    }

    let prop = {}
    var parsedRes

    if (prefectures.some(p => address.startsWith(p))) {
      parseRes = await japa.parse(address)
    } else {
      for (const p of prefectures) {
        const response = await japa.parse(p + address)
        if (response) {
          parseRes = response
          break
        }
      }
    }

    if (parseRes) {
      Object.entries(mappings).forEach(([k,v]) => {
        if (parseRes[k]) { prop[v] = parseRes[k] }
      })

      if (!prop.house_number && parseRes.left?.startsWith('‐')) {
        prop.house_number = parseInt(parseRes.left.replace('‐',''))
      }

      return prop
    }
  },
  updateFields: function (obj1, obj2) {
    Object.entries(obj2).forEach(([k,v]) => {
      if (k in obj1) { obj1[k] = v}
    })
    return obj1
  }
}
