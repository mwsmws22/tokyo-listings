const japa = require('jp-address-parser')

exports.parseAddress = address => {
  const prefectures = ['東京都', '埼玉県', '神奈川県', '千葉県', '静岡県']
  const mappings = {
    prefecture: 'prefecture',
    city: 'municipality',
    town: 'town',
    chome: 'district',
    ban: 'block',
    go: 'house_number'
  }

  const mapper = (res, resolve) => {
    const prop = {}

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
        .catch(err => reject(err))
    } else {
      prefectures
        .map(p => () => japa.parse(p + address))
        .reduce((prev, curr) => prev.catch(curr), Promise.reject())
        .then(res => mapper(res, resolve))
        .catch(err => reject(err))
    }
  })
}

exports.updateFields = (obj1, obj2) => {
  Object.entries(obj2).forEach(([k, v]) => {
    if (k in obj1) {
      obj1[k] = v
    }
  })
  return obj1
}

exports.axiosOptions = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
    'Content-Type': 'application/json'
  }
}

exports.formatAddress = p => {
  let address = p.prefecture + p.municipality + p.town

  if (p.district) {
    address += `${p.district}丁目`
  }
  if (p.block) {
    address += p.block
    if (p.house_number) {
      address += `-${p.house_number}`
    }
  } else if (p.house_number) {
    address += p.house_number
  }

  return address
}
