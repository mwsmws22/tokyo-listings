const cheerio = require('cheerio')
const cloneDeep = require('clone-deep')
const Utils = require('../utils/Utils')

// for writing out html to file
// const fs = require('fs');
// fs.writeFileSync('test.html', html, {'encoding': 'utf-8'});

const dataStruct = {
  property: {
    prefecture: '',
    municipality: '',
    town: '',
    district: '',
    block: '',
    house_number: '',
    property_type: '',
    interest: ''
  },
  listing: {
    url: '',
    monthly_rent: '',
    reikin: '',
    security_deposit: '',
    square_m: '',
    closest_station: '',
    walking_time: '',
    availability: ''
  }
}

const parseAerasGroup = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('.price', '.room').text().replace('万円', '')
  output.listing.reikin = $('dt:contains("敷金/礼金/保証金：") + dd')
    .text()
    .match(/(\d+)/g)[1]
  output.listing.security_deposit = $('dt:contains("敷金/礼金/保証金：") + dd')
    .text()
    .match(/(\d+)/g)[0]
  output.listing.square_m = $('dt:contains("専有面積：") + dd').text().replace('m²', '')

  const propertyType = $('dt:contains("種別/構造：") + dd')
    .text()
    .match(/賃貸(.*?)\//)[1]

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('dt:contains("所在地：") + dd').text().replace('ー', '-')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('dt:contains("交通：") + dd')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = `${text.match(/「(.*?)」/)[1]}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseAtHome = async (url, html) => {
  const $ = cheerio.load(html)

  const output = cloneDeep(dataStruct)
  output.listing.url = url
  output.listing.monthly_rent = $('.num', '.data.payments').text().replace('万円', '')

  const reikin = $('th:contains("礼金") + td', '.mainItemInfo.bukkenOverviewInfo')
    .text()
    .replace('ヶ月', '')
  if (reikin === 'なし') {
    output.listing.reikin = '0'
  } else if (reikin.includes('万円')) {
    output.listing.reikin = Number(
      (
        parseFloat(reikin.replace('万円', '')) / parseFloat(output.listing.monthly_rent)
      ).toFixed(1)
    ).toString()
  } else {
    output.listing.reikin = reikin
  }

  const securityDeposit = $(
    'th:contains("敷金") + td',
    '.mainItemInfo.bukkenOverviewInfo'
  )
    .text()
    .replace('ヶ月', '')
  if (securityDeposit === 'なし') {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('万円')) {
    output.listing.security_deposit = Number(
      (
        parseFloat(securityDeposit.replace('万円', '')) /
        parseFloat(output.listing.monthly_rent)
      ).toFixed(1)
    ).toString()
  } else {
    output.listing.security_deposit = securityDeposit
  }

  output.listing.square_m = $(
    'th:contains("面積") + td',
    '.mainItemInfo.bukkenOverviewInfo'
  )
    .text()
    .replace('m²', '')

  let address = $('.text-with-button', '.mainItemInfo.bukkenOverviewInfo').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('th:contains("交通") + td p', '.mainItemInfo.bukkenOverviewInfo')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = `${text.match(/\s\/\s(.*?)駅/)[1]}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  output.listing.availability = '募集中'

  const propertyType = $(
    'th:contains("種目") + td',
    '.mainItemInfo.bukkenOverviewInfo'
  ).html()

  if (propertyType === '賃貸一戸建て' || propertyType === '賃貸テラスハウス') {
    output.property.property_type = '一戸建て'
  } else if (propertyType === '賃貸マンション' || propertyType === '賃貸アパート') {
    output.property.property_type = 'アパート'
  }

  return output
}
const parseAxelHome = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'

  const monthlyRent = $('th:contains("賃料") + td').text()
  const squareM = $('th:contains("面積") + td').text()
  const securityDeposit = $('th:contains("敷金") + td').text()
  const reikin = $('th:contains("礼金") + td').text()

  if (!monthlyRent.includes('〜')) {
    output.listing.monthly_rent =
      parseInt(
        monthlyRent
          .match(/(.*?)円/)[1]
          .replace('，', '')
          .convertHalfWidth()
      ) / 10000
  } else if (!monthlyRent.includes('円')) {
    return null
  }

  if (!squareM.includes('〜')) {
    output.listing.square_m = squareM.match(/^(.*?)㎡/)[1].convertHalfWidth()
  }

  if (!securityDeposit.includes('〜')) {
    output.listing.security_deposit = securityDeposit
      .replace('ヶ月', '')
      .convertHalfWidth()
  }

  if (!reikin.includes('〜')) {
    output.listing.reikin = reikin.replace('ヶ月', '').convertHalfWidth()
  }

  output.property.property_type = 'アパート'

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatch = $('th:contains("交通") + td')
    .text()
    .match(/線(.*?)分/)[1]
  output.listing.closest_station = stationMatch.match(/^(.*?)駅/)[0].replace('　', '')
  output.listing.walking_time = stationMatch.match(/徒歩(.*?)$/)[1].convertHalfWidth()

  return output
}
const parseBestex = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(
      $('th:contains("賃料") + td')
        .first()
        .text()
        .match(/^(.*?)円/)[1]
        .replace(',', '')
    ) / 10000
  output.listing.square_m = $('th:contains("面積") + td')
    .first()
    .text()
    .match(/^(.*?)㎡/)[1]
  output.listing.security_deposit = $('th:contains("敷金") + td')
    .text()
    .match(/(\d+).*/)[1]
  output.listing.reikin = $('th:contains("礼金") + td').text().replace('ヶ月', '')
  output.property.property_type = 'アパート'

  let address = $('th:contains("住所") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("最寄駅") + td')
    .text()
    .matchAll(/線(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = match[1].match(/^\s(.*?)\s/)[1]
      const tempWalkTime = match[1].match(/徒歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseBunkyoku = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('span.num._color-main')
    .eq(0)
    .text()
    .replace('万円', ' ')

  if (output.listing.monthly_rent.includes('要問い合わせ')) {
    throw new Error('no longer available')
  }

  output.listing.square_m = $('th:contains("面積") + td').text().replace('㎡', '')
  output.listing.security_deposit = $('th:contains("敷金") + td')
    .text()
    .replace('ヶ月', '')
  output.listing.reikin = $('th:contains("礼金") + td').text().replace('ヶ月', '')

  const stationMatches = $('th:contains("交通") + td')
    .text()
    .matchAll(/線(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/-\s(.*?)駅/)[1]}駅`
      const tempWalkTime = match[1].match(/徒.*?(\d+).*$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  const propertyType = $('th:contains("物件種別") + td').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  }

  let address = $('th:contains("所在地") + td').text()

  if (/^谷中\d丁目$/.test(address)) {
    address = `東京都台東区${address}`
  }
  if (/^東五軒町$/.test(address)) {
    address = `東京都新宿区${address}`
  }

  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  return output
}
const parseCentury21 = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('th:contains("賃料") + td').text().replace('万円', '')
  output.listing.square_m = $('th:contains("建物/専有面積") + td')
    .eq(1)
    .text()
    .match(/^(.*?)m²/m)[1]
    .replace(/[\t|\n]/gm, '')
  output.listing.security_deposit = $('th:contains("敷金/礼金") + td')
    .text()
    .match(/(.*?)\//)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
    .replace(/[\t|\n]/gm, '')
  output.listing.reikin = $('th:contains("敷金/礼金") + td')
    .text()
    .match(/\/(.*?)$/)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
    .replace(/[\t|\n]/gm, '')

  const propertyType = $('th:contains("物件種目") + td').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === '貸家') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  output.listing.closest_station = $('ul', 'th:contains("アクセス") + td')
    .eq(0)
    .children()
    .eq(0)
    .text()
    .match(/^(.*?)\s徒/m)[1]
    .replace(/[\t|\n]/gm, '')
  output.listing.walking_time = $('ul', 'th:contains("アクセス") + td')
    .eq(0)
    .children()
    .eq(0)
    .text()
    .match(/徒歩(.*?)分/m)[1]
    .replace(/[\t|\n]/gm, '')

  return output
}
const parseChintai = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = parseFloat(
    $('span.rent', 'table').first().text().replace('万円', '')
  )
  output.listing.square_m = $('th:contains("専有面積") + td')
    .text()
    .match(/(.*?)m²/)[1]

  const securityDeposit = $('th:contains("敷金") + td')
    .text()
    .match(/(.*?)\//)[1]
    .replace(/\s/g, '')
  const reikin = $('th:contains("礼金") + td')
    .text()
    .match(/(.*?)\//)[1]
    .replace(/\s/g, '')

  if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else if (securityDeposit.includes('--') || securityDeposit.includes('なし')) {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('万円')) {
    output.listing.security_deposit =
      parseFloat(securityDeposit.replace('万円', '')) / output.listing.monthly_rent
  }

  if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else if (reikin.includes('--') || reikin.includes('なし')) {
    output.listing.reikin = '0'
  } else if (reikin.includes('万円')) {
    output.listing.reikin =
      parseFloat(reikin.replace('万円', '')) / output.listing.monthly_rent
  }

  let address = $('th:contains("住所") + td')
    .text()
    .replace('地図で物件の周辺環境をチェック！', '')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('dl', 'th:contains("交通") + td')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = `${text.match(/\/(.*?)駅/)[1]}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  const propertyType = $('th:contains("建物種別") + td').text()

  if (propertyType === '貸家' || propertyType === 'テラスハウス') {
    output.property.property_type = '一戸建て'
  } else if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else {
    output.property.property_type = propertyType
  }

  return output
}
const parseChintaiEx = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('th:contains("賃料/管理費等") + td')
    .text()
    .match(/(.*?)万円/)[1]
    .replace(/\s/g, '')
  output.listing.square_m = $('th:contains("間取り/面積") + td')
    .text()
    .match(/\/\s(.*?)m²/)[1]

  const securityDeposit = $('th:contains("敷金") + td').text()
  const reikin = $('th:contains("礼金") + td').text()

  if (securityDeposit.includes('無料')) {
    output.listing.security_deposit = 0
  } else {
    output.listing.security_deposit =
      parseFloat(securityDeposit.replace('万円', '')) / output.listing.monthly_rent
  }

  if (reikin.includes('無料')) {
    output.listing.reikin = 0
  } else {
    output.listing.reikin =
      parseFloat(reikin.replace('万円', '')) / output.listing.monthly_rent
  }

  const propertyType = $('th:contains("種別/構造") + td')
    .text()
    .match(/(.*?)\//)[1]

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === '一戸建' || propertyType === 'テラスハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("主要交通機関") + td')
    .text()
    .matchAll(/\/(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/^(.*?)\s/)[1].replace('駅', '')}駅`
      const tempWalkTime = match[1].match(/(\d+)/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseDiyp = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  if ($('li.contact_area').text().includes('募集は終了しております')) {
    throw new Error('no longer available')
  }

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt($('dt:contains("賃料：") + dd').text().replace('¥', '').replace(',', '')) /
    10000
  output.listing.square_m = $('dt:contains("面積：") + dd').text().replace('㎡', '')

  const securityDepositReikin = $('p:contains("敷金：")')
    .text()
    .noSpaces()
    .replace(/\([^()]*\)/g, '')
    .replace(/（[^（）]*）/, '')

  output.listing.security_deposit = securityDepositReikin
    .match(/敷金：(.*?)礼金：/)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
    .replace('-', '0')
  output.listing.reikin = securityDepositReikin
    .match(/礼金：(.*?)償却：/)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
    .replace('-', '0')

  let address = $('dt:contains("所在地：") + dd').text().noSpaces()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('dt:contains("最寄駅：") + dd')
    .text()
    .matchAll(/「(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/(.*?)」/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseGoodroom = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'

  const monthlyRent = $('th:contains("家賃") + td').text().remove('\n')

  if (monthlyRent === '-') {
    throw new Error('no longer available')
  }

  output.listing.monthly_rent = monthlyRent.remove('円', ',').toManen()

  if (!output.listing.monthly_rent) {
    return null
  }

  output.listing.square_m = $('th:contains("広さ") + td')
    .text()
    .replace('㎡', '')
    .replace(/\n/g, '')
  output.listing.security_deposit = $('th:contains("敷金／礼金") + td')
    .text()
    .replace(/\n/g, '')
    .match(/^(.*?)\s\//)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
  output.listing.reikin = $('th:contains("敷金／礼金") + td')
    .text()
    .replace(/\n/g, '')
    .match(/\/\s(.*?)$/)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')

  if (output.listing.security_deposit.includes('万円')) {
    output.listing.security_deposit = (
      parseFloat(output.listing.security_deposit) /
      parseFloat(output.listing.monthly_rent)
    ).toFixed(1)
  }

  if (output.listing.reikin.includes('万円')) {
    output.listing.reikin = (
      parseFloat(output.listing.reikin) / parseFloat(output.listing.monthly_rent)
    ).toFixed(1)
  }

  let address = $('.address').text().replace(/\n/g, '').replace(/ー/g, '-')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('li', '.traffic')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = `${text.match(/\s(.*?)駅/)[1]}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseHatomarkSite = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('th:contains("賃料") + td').text().replace('万円', '')
  output.listing.square_m = $('th:contains("専有面積") + td').text().replace('㎡', '')
  output.listing.security_deposit = $('th:contains("敷金／保証金") + td')
    .text()
    .match(/(.*?)／/)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
  output.listing.reikin = $('th:contains("礼金") + td')
    .text()
    .replace('ヶ月', '')
    .replace('なし', '0')

  const propertyType = $('th:contains("物件種目") + td').text().replace('貸', '')

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === '戸建住宅' || propertyType === 'テラスハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('th:contains("所在地") + td')
    .text()
    .match(/\n(.*?)\n/)[1]
    .replace(/\s/g, '')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  output.listing.closest_station = $('th:contains("交通") + td')
    .text()
    .replace(/^\s+/g, '')
    .match(/\s(.*?)\s徒/)[1]
  output.listing.walking_time = $('th:contains("交通") + td')
    .text()
    .match(/徒歩(.*?)分/)[1]

  return output
}
const parseHouseAsocio = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  const titleText = $('.entry-title').text()

  if (titleText.includes('ご成約済')) {
    throw new Error('no longer available')
  }

  output.listing.url = url
  output.listing.availability = '募集中'
  output.property.property_type = '一戸建て'
  output.listing.monthly_rent = titleText.match(/】(.*?)万円/)[1]
  output.listing.square_m = $('td:contains("専有面積") + td').text().replace('平米', '')
  output.listing.security_deposit = $('td:contains("敷金/礼金") + td')
    .text()
    .match(/(.*?)\//)[1]
    .replace('ヶ月', '')
  output.listing.reikin = $('td:contains("敷金/礼金") + td')
    .text()
    .match(/\/(.*?)$/)[1]
    .replace('ヶ月', '')

  let address = titleText.match(/【(.*?)】/)[1].replace('戸建', '')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  output.listing.closest_station = titleText.match(/^(.*?)の/)[1]
  output.listing.walking_time = $(
    `p:contains("${output.listing.closest_station}"):contains("徒歩")`
  )
    .text()
    .match(/徒歩(.*?)分/)[1]

  return output
}
const parseHouseGoo = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('th:contains("賃料") + td')
    .text()
    .match(/^(.*?)万円/)[1]
  output.listing.square_m = $('th:contains("面積") + td').first().text().replace('m2', '')
  output.listing.security_deposit = $('th:contains("礼金・敷金") + td')
    .text()
    .match(/^(.*?)\s\//)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')
  output.listing.reikin = $('th:contains("礼金・敷金") + td')
    .text()
    .match(/\/\s(.*?)$/)[1]
    .replace('ヶ月', '')
    .replace('なし', '0')

  const propertyType = $('.h1_title_box-type').text().replace('賃貸', '')

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  }

  let address = $('th:contains("所在地") + td')
    .first()
    .text()
    .match(/^(.*?)周辺地図/m)[1]
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('.access-list', '.detail_outline-data-sep2').children()

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = text.match(/\s(.*?)\s徒歩/)[1]
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseHouseOCN = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('th:contains("賃料") + td').text().replace('万円', '')
  output.listing.square_m = $('th:contains("専有面積") + td').text().replace('㎡', '')

  const securityDeposit = $('th:contains("敷金") + td').text()
  const reikin = $('th:contains("礼金") + td').text()

  if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else if (securityDeposit.includes('なし')) {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('万円')) {
    output.listing.security_deposit =
      parseFloat(securityDeposit.replace('万円', '')) / output.listing.monthly_rent
  }

  if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else if (reikin.includes('なし')) {
    output.listing.reikin = '0'
  } else if (reikin.includes('万円')) {
    output.listing.reikin =
      parseFloat(reikin.replace('万円', '')) / output.listing.monthly_rent
  }

  const propertyType = $('tbody')
    .eq(0)
    .children()
    .eq(1)
    .children()
    .eq(4)
    .text()
    .match(/^(.*?)\n/)[1]
    .replace('賃貸', '')

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === 'テラスハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('th:contains("住所") + td').children().eq(0).text().noSpaces()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  output.listing.closest_station = $('ul', 'th:contains("交通機関") + td')
    .children()
    .eq(0)
    .text()
    .match(/線\s(.*?)\s徒/m)[1]
  output.listing.walking_time = $('ul', 'th:contains("交通機関") + td')
    .children()
    .eq(0)
    .text()
    .match(/徒歩(.*?)分/m)[1]

  return output
}
const parseHousesTokyo = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  if ($('.contact_area').eq(0).text().includes('募集は終了しております')) {
    throw new Error('no longer available')
  }

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt($('dt:contains("賃料：") + dd').text().replace('¥', '').replace(',', '')) /
    10000
  output.listing.square_m = $('dt:contains("建物面積：") + dd').text().replace('㎡', '')
  output.listing.security_deposit = $('p:contains("敷金：")')
    .text()
    .match(/敷金：(.*?)ヶ月/)[1]
  output.listing.reikin = $('p:contains("敷金：")')
    .text()
    .match(/礼金：(.*?)ヶ月/)[1]
  output.property.property_type = '一戸建て'

  let address = $('dt:contains("住所：") + dd').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('dt:contains("最寄駅：") + dd')
    .text()
    .matchAll(/「(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/^(.*?)」/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseJKHome = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(
      $('th:contains("賃料・価格") + td')
        .text()
        .match(/:(.*?)円/)[1]
        .replace(',', '')
        .replace('税込', '')
    ) / 10000
  output.listing.square_m = $('th:contains("間取り") + td')
    .text()
    .match(/（(.*?)\)/)[1]
    .replace('㎡', '')
  output.listing.security_deposit = $('th:contains("諸費用") + td')
    .text()
    .replace('なし', '0')
    .replace('無し', '0')
    .convertHalfWidth()
    .match(/(\d)/g)[0]
  output.listing.reikin = $('th:contains("諸費用") + td')
    .text()
    .replace('なし', '0')
    .replace('無し', '0')
    .convertHalfWidth()
    .match(/(\d)/g)[1]

  const propertyType = $('p.address')
    .text()
    .match(/\[(.*?)\]/)[1]
    .replace('賃貸', '')

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === '戸建て') {
    output.property.property_type = '一戸建て'
  }

  let address = $('th:contains("住 所") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("アクセス") + td')
    .text()
    .matchAll(/[【｢『「\s](.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/(.*?)[】」』｣\s]/)[1].replace('駅', '')}駅`
      const tempWalkTime = match[1].convertHalfWidth().match(/[」】』]*(\d+)/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseJoylifestyle = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  if ($('.entry-title').text().includes('終了')) {
    throw new Error('no longer available')
  }

  // output.listing.url = url.replace(/&shu=(.*?)$/,'');
  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(
      $('.dpoint4')
        .text()
        .match(/(.*?)円/)[1]
    ) / 10000
  output.listing.square_m = $('th:contains("面積") + td').text().replace('m²', '')

  const securityDeposit = $('dt:contains("敷金") + dd').text()
  const reikin = $('dt:contains("礼金") + dd').text()

  if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else if (securityDeposit.includes('円')) {
    output.listing.security_deposit = Number(
      (
        parseFloat(securityDeposit.replace('円', '')) /
        10000 /
        parseFloat(output.listing.monthly_rent)
      ).toFixed(2)
    ).toString()
  } else if (securityDeposit === '') {
    output.listing.security_deposit = '0'
  }

  if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else if (reikin.includes('円')) {
    output.listing.reikin = Number(
      (
        parseFloat(reikin.replace('円', '')) /
        10000 /
        parseFloat(output.listing.monthly_rent)
      ).toFixed(2)
    ).toString()
  } else if (reikin === '') {
    output.listing.reikin = '0'
  }

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("交通") + td')
    .text()
    .matchAll(/線(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/(.*?)駅/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  const propertyType = $('dt:contains("賃料") + dd + dd').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === 'テラスハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  return output
}
const parseKenCorp = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(
      $('th:contains("賃料/管理費") + td')
        .text()
        .match(/^(.*?)円/)[1]
        .replace(',', '')
    ) / 10000
  output.listing.square_m = $('th:contains("専有面積") + td')
    .text()
    .match(/^(.*?)㎡/)[1]
  output.listing.security_deposit = $('th:contains("敷金/礼金") + td')
    .text()
    .match(/^(.*?)\s\//)[1]
    .replace('ヶ月', '')
    .replace('無', '0')
  output.listing.reikin = $('th:contains("敷金/礼金") + td')
    .text()
    .match(/\/\s(.*?)$/)[1]
    .replace('ヶ月', '')
    .replace('無', '0')
  output.property.property_type = 'アパート'

  let address = $('th:contains("住所") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("最寄駅") + td')
    .text()
    .matchAll(/線(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = match[1].match(/^\s(.*?)\s/)[1]
      const tempWalkTime = match[1].match(/徒歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseKodateChintai = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('.EstateDetail-Sec1-RentFee')
    .text()
    .noSpaces()
    .match(/(.*?)万円/)[1]
  output.listing.square_m = $('dd:contains("広さ")')
    .text()
    .match(/広さ：(.*?)㎡/)[1]
  output.listing.security_deposit = $('p:contains("敷")')
    .text()
    .replace('敷', '')
    .replace('ヶ月', '')
    .replace('無', '0')
    .replace('--', '0')
  output.listing.reikin = $('p:contains("礼")')
    .text()
    .replace('礼', '')
    .replace('ヶ月', '')
    .replace('無', '0')
    .replace('--', '0')

  const propertyType = $('dt:contains("種別") + dd').text()

  if (propertyType === '一戸建') {
    output.property.property_type = '一戸建て'
  }

  let address = $('dt:contains("住所") + dd').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  output.listing.closest_station = `${$('dt:contains("交通機関") + dd')
    .text()
    .match(/線\s(.*?)(?:\s|\/)/)[1]
    .replace('駅', '')}駅`
  output.listing.walking_time = $('dt:contains("交通機関") + dd')
    .text()
    .match(/徒歩(.*?)分/)[1]

  return output
}
const parseLifullHomes = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('#chk-bkc-moneyroom')
    .text()
    .match(/(.*?)万円/)[1]
  output.listing.square_m = $('#chk-bkc-housearea').text().replace('m²', '').noSpaces()

  const securityDeposit = $('#chk-bkc-moneyshikirei')
    .text()
    .match(/(.*?)\s\//)[1]
  const reikin = $('#chk-bkc-moneyshikirei')
    .text()
    .match(/\/\s(.*?)$/m)[1]

  if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else if (securityDeposit.includes('-') || securityDeposit.includes('無')) {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('万円')) {
    output.listing.security_deposit =
      parseFloat(securityDeposit.replace('万円', '')) / output.listing.monthly_rent
  }

  if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else if (reikin.includes('-') || reikin.includes('無')) {
    output.listing.reikin = '0'
  } else if (reikin.includes('万円')) {
    output.listing.reikin =
      parseFloat(reikin.replace('万円', '')) / output.listing.monthly_rent
  }

  let address = $('#chk-bkc-fulladdress')
    .contents()
    .first()
    .text()
    .replace(/[\s|\n]/gm, '')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('p', '#chk-bkc-fulltraffic')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (
      text.indexOf('バス') === -1 &&
      text.indexOf('他に') === -1 &&
      text.indexOf('通勤') === -1 &&
      text.indexOf('km') === -1
    ) {
      // because of outlier: "京成電鉄金町線 柴又 徒歩29分"
      // another outlier: "つくばエクスプレス 浅草駅 徒歩10分"
      // another outlier: "東京メトロ東西線落合駅徒歩５分"
      // another outlier: "ＪＲ総武線 平井駅 3.1km"
      const tempStation = `${text
        .match(/(?:\s|線)(.*?)徒歩/)[1]
        .noSpaces()
        .replace('駅', '')}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  const propertyType = $('#chk-bkh-type').text().replace('賃貸', '')

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === 'テラスハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  return output
}
const parseOasisEstate = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(
      $('th:contains("月額賃料 (坪単価)") + td')
        .text()
        .replace(/[\t|\n]/gm, '')
        .match(/^(.*?)円/)[1]
        .replace(',', '')
    ) / 10000
  output.listing.square_m = $('th:contains("専有面積") + td')
    .text()
    .match(/\((.*?)㎡/)[1]
  output.listing.reikin = $('th:contains("礼金") + td').text().replace('ヶ月', '')

  const securityDeposit = $('th:contains("保証金") + td').text().replace(/ヶ月/g, '')

  if (securityDeposit.includes('住居')) {
    output.listing.security_deposit = securityDeposit.match(/住居(.*?)$/)[1]
  } else {
    output.listing.security_deposit = securityDeposit
  }

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("交通アクセス") + td')
    .text()
    .matchAll(/\/(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = match[1].match(/^\s(.*?)\s徒歩約/)[1]
      const tempWalkTime = match[1].match(/徒歩約(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseOmusubiEstate = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'

  const monthlyRent = $('dt:contains("賃料") + dd').text().replace('万円', '')

  if (monthlyRent === '') {
    output.listing.monthly_rent = $('dt:contains("価格") + dd').text().replace('万円', '')
  } else {
    output.listing.monthly_rent = monthlyRent
  }

  if (output.listing.monthly_rent === 'ご成約済') {
    throw new Error('no longer available')
  }

  output.listing.security_deposit = $('dt:contains("敷金礼金") + dd')
    .text()
    .match(/(\d+)/g)[0]
  output.listing.reikin = $('dt:contains("敷金礼金") + dd').text().match(/(\d+)/g)[1]
  output.listing.square_m = $('dt:contains("専有面積") + dd').text().replace('m²', '')

  let address = $('dt:contains("所在地") + dd').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('dt:contains("交通") + dd')
    .text()
    .matchAll(/線(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1 && match[1].indexOf('停') === -1) {
      const tempMatch = match[1].replace(/[「」『』\s]/g, '')
      const tempStation = tempMatch.match(/(.*?)徒歩/)[1]
      const tempWalkTime = tempMatch.match(/徒歩(.*)/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parsePetHomeWeb = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('.price-number').text()
  output.listing.square_m = $('th:contains("専有面積") + td')
    .text()
    .replace('㎡', '')
    .noSpaces()
  output.listing.closest_station = $('th:contains("交通") + td')
    .text()
    .match(/線(.*?)徒歩/)[1]
  output.listing.walking_time = $('th:contains("交通") + td')
    .text()
    .match(/徒歩(.*?)分/)[1]

  const securityDeposit = $('th:contains("敷金/保証金") + td')
    .text()
    .replace(/(\r\n|\n|\r)/gm, '')
    .noSpaces()
    .match(/(.*?)\//)[1]
  const reikin = $('th:contains("礼金") + td')
    .text()
    .match(/(.*?)(\/|$)/)[1]
    .replace('※税込', '')

  if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else if (securityDeposit.includes('なし')) {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('万円')) {
    output.listing.security_deposit =
      parseFloat(securityDeposit.replace('万円', '')) / output.listing.monthly_rent
  }

  if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else if (reikin.includes('なし')) {
    output.listing.reikin = '0'
  } else if (reikin.includes('万円')) {
    output.listing.reikin =
      parseFloat(reikin.replace('万円', '')) / output.listing.monthly_rent
  }

  const propertyType = $('th:contains("物件種目") + td').text().replace('賃貸', '')

  if (propertyType === '戸建') {
    output.property.property_type = '一戸建て'
  } else if (propertyType === 'マンション' || propertyType === 'アパート') {
    output.property.property_type = 'アパート'
  }

  let address = $('th:contains("所在地") + td').text().noSpaces()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  return output
}
const parseRealTokyoEstate = async (url, html) => {
  const $ = cheerio.load(html)

  const output = cloneDeep(dataStruct)
  output.listing.url = url

  let tempRent = $('.description_price_val').text()
  if (tempRent.includes('～')) {
    tempRent = tempRent.split('～')[0]
  }

  const man = tempRent.match(/(.*)万/)[1]
  let sen = tempRent.match(/万(.*)円/)[1]

  if (sen !== '') {
    sen = sen.remove(',')
    output.listing.monthly_rent = parseInt(man) + sen.toManen()
  } else {
    output.listing.monthly_rent = man
  }

  const reikin = $('span', '#estate_info_fee_value').text()
  if (reikin.includes('円')) {
    output.listing.reikin =
      reikin.remove(',', '円').toManen() / output.listing.monthly_rent
  } else if (reikin === 'なし') {
    output.listing.reikin = '0'
  } else {
    output.listing.reikin = reikin.remove('ヶ月')
  }

  const securityDeposit = $('span', '#estate_info_deposite_value').text()
  if (securityDeposit.includes('円')) {
    output.listing.security_deposit =
      securityDeposit.remove(',', '円').toManen() / output.listing.monthly_rent
  } else if (securityDeposit === 'なし') {
    output.listing.security_deposit = '0'
  } else {
    output.listing.security_deposit = securityDeposit.remove('ヶ月')
  }

  let squareM = $('.description_area_val').text()
  if (squareM.includes('～')) {
    squareM = squareM.split('～')[0]
  }

  output.listing.square_m = squareM.remove('㎡')

  let address = $('td:contains("所在地：") + td').text().remove('\n', '\t')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('td:contains("交通：") + td')
    .text()
    .matchAll(/「(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/(.*?)」/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*)/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  output.listing.availability = '募集中'

  return output
}
const parseRehouse = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('.mrh-table-article__price')
    .first()
    .text()
    .replace('万円', '')
    .noSpaces()
  output.listing.reikin = $('th:contains("敷金／礼金／保証金") + td')
    .text()
    .match(/(\d+)/g)[1]
  output.listing.security_deposit = $('th:contains("敷金／礼金／保証金") + td')
    .text()
    .match(/(\d+)/g)[0]
  output.listing.square_m = $('th:contains("専有面積")+ td, th:contains("建物面積") + td')
    .first()
    .text()
    .replace('㎡', '')
    .noSpaces()

  const propertyType = $('.mrh-label-article')
    .text()
    .match(/賃貸(.*?)$/)[1]

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('th:contains("所在地") + td').text().replace('周辺地図', '')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("最寄り駅") + td')
    .text()
    .matchAll(/「(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1 && match[1].indexOf('停') === -1) {
      const tempStation = `${match[1].match(/(.*?)」/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*)/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseRenovDepart = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'

  const monthlyRent = $('th:contains("家賃") + td').eq(0).text().remove(',', '￥')

  if (!monthlyRent) {
    throw new Error('no longer available')
  }

  output.listing.monthly_rent = monthlyRent.toManen()
  output.listing.security_deposit = $('th:contains("敷/礼") + td')
    .eq(0)
    .text()
    .match(/^(.*?)\//)[1]
    .remove('ヶ月')
    .replace('-', '0')
  output.listing.reikin = $('th:contains("敷/礼") + td')
    .eq(0)
    .text()
    .match(/\/(.*?)$/)[1]
    .remove('ヶ月')
    .replace('-', '0')
  output.listing.square_m = $('th:contains("間取り") + td')
    .eq(0)
    .text()
    .match(/（(.*?)㎡/)[1]

  let address = $('th:contains("住所") + td').eq(0).text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('p', 'th:contains("交通") + td')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = `${text.match(/「(.*?)」/)[1]}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseRStore = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(
      $('h3:contains("賃料") + p', 'li')
        .first()
        .text()
        .replace('円', '')
        .replace(',', '')
        .noSpaces()
    ) / 10000
  output.listing.square_m = $('h3:contains("面積") + p', 'li').text().replace('㎡', '')
  output.listing.security_deposit = $('h3:contains("敷金 / 保証金") + p', 'li')
    .text()
    .replace('ヶ月分', '')
    .noSpaces()
    .replace('-', '0')
  output.listing.reikin = $('h3:contains("礼金") + p', 'li')
    .first()
    .text()
    .replace('ヶ月分', '')
    .noSpaces()
    .replace('-', '0')

  let address = $('h3:contains("所在地") + p', 'li').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('h3:contains("最寄り駅") + p', 'li')
    .text()
    .matchAll(/「(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1 && match[1].indexOf('停') === -1) {
      const tempStation = `${match[1].match(/(.*?)」/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*)/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  if (Number.isNaN(output.listing.monthly_rent)) {
    throw new Error('missing rent')
  }

  return output
}
const parseSmocca = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $(
    '.typo_color_orange_a',
    'th:contains("賃料/管理費等") + td'
  )
    .text()
    .replace('万円', '')
  output.listing.square_m = $('th:contains("面積") + td').eq(0).text().replace('m²', '')
  output.listing.security_deposit =
    parseFloat(
      $('th:contains("敷金") + td').text().replace('万円', '').replace('無料', '0')
    ) / output.listing.monthly_rent
  output.listing.reikin =
    parseFloat(
      $('th:contains("礼金") + td').text().replace('万円', '').replace('無料', '0')
    ) / output.listing.monthly_rent

  const propertyType = $('th:contains("種別/構造") + td')
    .text()
    .match(/^(.*?)\//)[1]

  if (propertyType.includes('マンション') || propertyType.includes('アパート')) {
    output.property.property_type = 'アパート'
  } else if (propertyType.includes('一戸建')) {
    output.property.property_type = '一戸建て'
  }

  let address = $('div', 'th:contains("所在地") + td').first().text().noSpaces()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("主要交通機関") + td')
    .text()
    .matchAll(/\/(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/^(.*?)\s/)[1].replace('駅', '')}駅`
      const tempWalkTime = match[1].match(/歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseSpacelist = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt($('.fsL').eq(0).text().replace('¥', '').replace(',', '')) / 10000
  output.listing.square_m = $('.fsL').eq(2).text().replace('m2', '')
  output.listing.security_deposit = $('li:contains("敷金")')
    .text()
    .match(/：(.*?)ヶ月/)[1]
  output.listing.reikin = $('li:contains("礼金")')
    .text()
    .match(/：(.*?)ヶ月/)[1]

  const propertyType = $('li:contains("建物種類")')
    .text()
    .match(/：(.*?)$/)[1]

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('dt:contains("所在地：") + dd').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('dt:contains("最寄駅：") + dd')
    .text()
    .matchAll(/「(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/^(.*?)」/)[1]}駅`
      const tempWalkTime = match[1].match(/徒歩(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseSumaity = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('th:contains("賃料") + td')
    .eq(0)
    .text()
    .match(/^(.*?)万円/)[1]
  output.listing.square_m = $('th:contains("専有面積") + td')
    .eq(0)
    .text()
    .replace('m2', '')

  const securityDeposit = $('th:contains("敷金/礼金") + td')
    .text()
    .match(/^(.*?)\//)[1]
  const reikin = $('th:contains("敷金/礼金") + td')
    .text()
    .match(/\/(.*?)$/)[1]

  if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else if (securityDeposit.includes('-')) {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('万円')) {
    output.listing.security_deposit =
      parseFloat(securityDeposit.replace('万円', '')) / output.listing.monthly_rent
  }

  if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else if (reikin.includes('-')) {
    output.listing.reikin = '0'
  } else if (reikin.includes('万円')) {
    output.listing.reikin =
      parseFloat(reikin.replace('万円', '')) / output.listing.monthly_rent
  }

  const propertyType = $('th:contains("種別") + td').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType.includes('一戸建て')) {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  let address = $('th:contains("所在地") + td')
    .eq(0)
    .text()
    .remove('地図・周辺情報', ' ', '\n')
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('th:contains("交通") + td').eq(0).children()

  stations.each((i, elem) => {
    if ($(elem).text().indexOf('バス') === -1) {
      const tempStation = $(elem).children().eq(1).text()
      const tempWalkTime = $(elem)
        .children()
        .eq(2)
        .text()
        .match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseSuumo = async (url, html) => {
  const $ = cheerio.load(html)

  if (!$("link[rel='canonical']").attr('href').includes('chintai/jnc_')) {
    throw new Error('no longer available')
  }

  const output = cloneDeep(dataStruct)
  output.listing.url = url
  output.listing.monthly_rent = $('.property_view_note-emphasis')
    .text()
    .replace('万円', '')

  const reikin = $('span:contains("礼金")', '.property_view_note-list')
    .text()
    .replace('礼金: ', '')
    .replace('万円', '')
  if (reikin === '-') {
    output.listing.reikin = '0'
  } else {
    output.listing.reikin = Number(
      (parseFloat(reikin) / parseFloat(output.listing.monthly_rent)).toFixed(1)
    ).toString()
  }

  const securityDeposit = $('span:contains("敷金")', '.property_view_note-list')
    .text()
    .replace('敷金: ', '')
    .replace('万円', '')
  if (securityDeposit === '-') {
    output.listing.security_deposit = '0'
  } else {
    output.listing.security_deposit = Number(
      (parseFloat(securityDeposit) / parseFloat(output.listing.monthly_rent)).toFixed(1)
    ).toString()
  }

  output.listing.square_m = $('th:contains("専有面積") + td').text().replace('m2', '')

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('.property_view_table-read', 'th:contains("駅徒歩") + td')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1 && text.indexOf('車') === -1) {
      const tempStation = `${text.match(/\/(.*?)駅/i)[1]}駅`
      const tempWalkTime = text.match(/歩(.*?)分/i)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  output.listing.availability = '募集中'

  const propertyType = $('th:contains("建物種別") + td').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === 'テラス・タウンハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  return output
}
const parseTatoDesign = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent = $('dt:contains("賃料") + dd')
    .text()
    .remove('円', ',')
    .toManen()
  output.listing.square_m = $('dt:contains("面積") + dd').text().remove('㎡', ' ', '\n')
  output.listing.security_deposit = $('dt:contains("敷金／礼金") + dd')
    .text()
    .match(/\s+(.*?)\s／/)[1]
    .remove('ヶ月', 'か月')
    .replace('なし', '0')
  output.listing.reikin = $('dt:contains("敷金／礼金") + dd')
    .text()
    .match(/／\s(.*?)$/m)[1]
    .remove('ヶ月', 'か月')
    .replace('なし', '0')

  let address = $('dt:contains("住所") + dd').text().noSpaces()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('p', 'dt:contains("交通") + dd')

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = text.match(/「(.*?)」/)[1]
      const tempWalkTime = text.match(/徒歩(.*?)分/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseTokyoStyle = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  if ($('.cat-name').text().includes('Finished')) {
    throw new Error('no longer available')
  }

  output.listing.url = url

  const boxText = $('.c_box.intitle.glay_box').text()
  const shikikinReikinLine = boxText.match(/\n.*礼金.*\n/)[0]

  // because it can be 礼金1カ月/敷金1カ月 or 敷金 1ヶ月／礼金1ヶ月
  if (shikikinReikinLine.indexOf('礼金') < shikikinReikinLine.indexOf('敷金')) {
    output.listing.reikin = shikikinReikinLine.match(/.*(\d+).*(\d+)/)[1]
    output.listing.security_deposit = shikikinReikinLine.match(/.*(\d+).*(\d+)/)[2]
  } else {
    output.listing.security_deposit = shikikinReikinLine.match(/.*(\d+).*(\d+)/)[1]
    output.listing.reikin = shikikinReikinLine.match(/.*(\d+).*(\d+)/)[2]
  }
  const monthlyRent = boxText
    .match(/賃料(.*)円/)[1]
    .replace(/\s/g, '')
    .replace(',', '')
  output.listing.monthly_rent = (parseInt(monthlyRent) / 10000).toString()
  output.listing.square_m = boxText.match(/面積.*?(\d+(?:\.\d+)?)(?:平米|㎡|\?)/)[1]

  let address = boxText.match(/物件所在：(.*)/)[1]
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  output.listing.walking_time = boxText.match(/(?:線|ライナー).*?(\d+)/)[1]
  output.listing.closest_station = `${
    boxText.match(/(?:線|ライナー)\s(.*?)[\s,駅,歩,徒]/)[1]
  }駅`

  output.listing.availability = '募集中'

  return output
}
const parseTomigaya = async (url, html) => {
  const $ = cheerio.load(html)
  const output = cloneDeep(dataStruct)

  const monthlyRent = $('th:contains("賃料") + td').text()

  if ($('.attention').text() !== '') {
    throw new Error('no longer available')
  } else if (monthlyRent === '契約済み') {
    throw new Error('no longer available')
  }

  output.listing.url = url
  output.listing.availability = '募集中'
  output.listing.monthly_rent =
    parseInt(monthlyRent.replace('円', '').replace(',', '')) / 10000
  output.listing.square_m = $('th:contains("専有面積") + td')
    .text()
    .replace('m²', '')
    .noSpaces()
  output.listing.security_deposit = $('th:contains("敷金") + td')
    .text()
    .replace('ヶ月', '')
    .replace('なし', '0')
  output.listing.reikin = $('th:contains("礼金") + td')
    .text()
    .replace('ヶ月', '')
    .replace('なし', '0')

  const propertyType = $('th:contains("物件タイプ") + td').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === '戸建/テラスハウス') {
    output.property.property_type = '一戸建て'
  }

  let address = $('th:contains("所在地") + td').text().noSpaces()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stationMatches = $('th:contains("最寄り駅") + td')
    .text()
    .matchAll(/線(.*?)分/g)

  Array.from(stationMatches).forEach(match => {
    if (match[1].indexOf('バス') === -1) {
      const tempStation = `${match[1].match(/\s(.*?)\s/)[1]}駅`
      const tempWalkTime = match[1].match(/\s(.*?)$/)[1].match(/\s(.*?)$/)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  return output
}
const parseYahoo = async (url, html) => {
  const $ = cheerio.load(html)

  const output = cloneDeep(dataStruct)
  output.listing.url = url
  output.listing.monthly_rent = $('.DetailSummary__price__rent').text().remove('万円')

  const reikin = $('dt:contains("礼金：") + dd').text().remove('万円', ' ※')
  if (reikin === 'なし') {
    output.listing.reikin = '0'
  } else if (reikin.includes('ヶ月')) {
    output.listing.reikin = reikin.replace('ヶ月', '')
  } else {
    Number((6.688689).toFixed(1))
    output.listing.reikin = Number(
      (parseFloat(reikin) / parseFloat(output.listing.monthly_rent)).toFixed(1)
    ).toString()
  }

  const securityDeposit = $('dt:contains("敷金：") + dd')
    .text()
    .replace('万円', '')
    .replace(' ※', '')
  if (securityDeposit === 'なし') {
    output.listing.security_deposit = '0'
  } else if (securityDeposit.includes('ヶ月')) {
    output.listing.security_deposit = securityDeposit.replace('ヶ月', '')
  } else {
    output.listing.security_deposit = Number(
      (parseFloat(securityDeposit) / parseFloat(output.listing.monthly_rent)).toFixed(1)
    ).toString()
  }

  output.listing.square_m = $('th:contains("専有面積") + td').text().replace('m2', '')

  let address = $('th:contains("所在地") + td').text()
  address = await Utils.parseAddress(address)
  output.property = Utils.updateFields(output.property, address)

  const stations = $('ul', 'th:contains("交通") + td').eq(0).children()

  stations.each((i, elem) => {
    const text = $(elem).text()

    if (text.indexOf('バス') === -1) {
      const tempStation = `${text.match(/(.*?)駅/i)[1].noSpaces()}駅`
      const tempWalkTime = text.match(/徒歩(.*?)分/i)[1]

      if (output.listing.closest_station === '') {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
        output.listing.closest_station = tempStation
        output.listing.walking_time = tempWalkTime
      }
    }
  })

  output.listing.availability = '募集中'

  const propertyType = $('.brandTagType').text()

  if (propertyType === 'マンション') {
    output.property.property_type = 'アパート'
  } else if (propertyType === 'テラスハウス' || propertyType === 'タウンハウス') {
    output.property.property_type = '一戸建て'
  } else {
    output.property.property_type = propertyType
  }

  return output
}

exports.scrape = async (url, hostname, html) => {
  switch (hostname) {
    case 'www.aeras-group.jp':
      return parseAerasGroup(url, html)
    case 'www.athome.co.jp':
      return parseAtHome(url, html)
    case 'www.axel-home.com':
      return parseAxelHome(url, html)
    case 'www.bestexnet.co.jp':
      return parseBestex(url, html)
    case 'xn--ihqxo86hrls96efnv.com':
      return parseBunkyoku(url, html)
    case 'www.century21.jp':
      return parseCentury21(url, html)
    case 'www.chintai.net':
      return parseChintai(url, html)
    case 'chintai-ex.jp':
      return parseChintaiEx(url, html)
    case 'www.diyp.jp':
      return parseDiyp(url, html)
    case 'www.goodrooms.jp':
      return parseGoodroom(url, html)
    case 'www.hatomarksite.com':
      return parseHatomarkSite(url, html)
    case 'house.asocio.co.jp':
      return parseHouseAsocio(url, html)
    case 'house.goo.ne.jp':
      return parseHouseGoo(url, html)
    case 'house.ocn.ne.jp':
      return parseHouseOCN(url, html)
    case 'housestokyo.jp':
      return parseHousesTokyo(url, html)
    case 'www.jkhome.com':
      return parseJKHome(url, html)
    case 'joylifestyle.jp':
      return parseJoylifestyle(url, html)
    case 'www.kencorp.co.jp':
      return parseKenCorp(url, html)
    case 'kodate.chintaistyle.jp':
      return parseKodateChintai(url, html)
    case 'www.homes.co.jp':
      return parseLifullHomes(url, html)
    case 'www.oasis-estate.jp':
      return parseOasisEstate(url, html)
    case 'www.omusubi-estate.com':
      return parseOmusubiEstate(url, html)
    case 'www.pethomeweb.com':
      return parsePetHomeWeb(url, html)
    case 'www.realtokyoestate.co.jp':
      return parseRealTokyoEstate(url, html)
    case 'www.rehouse.co.jp':
      return parseRehouse(url, html)
    case 'www.renov-depart.jp':
      return parseRenovDepart(url, html)
    case 'www.r-store.jp':
      return parseRStore(url, html)
    case 'smocca.jp':
      return parseSmocca(url, html)
    case 'spacelist.jp':
      return parseSpacelist(url, html)
    case 'sumaity.com':
      return parseSumaity(url, html)
    case 'suumo.jp':
      return parseSuumo(url, html)
    case 'www.tatodesign.jp':
      return parseTatoDesign(url, html)
    case 'tokyo-style.cc':
      return parseTokyoStyle(url, html)
    case 'tomigaya.jp':
      return parseTomigaya(url, html)
    case 'tokyo-designers.com':
      return parseTomigaya(url, html)
    case 'east-and-west.jp':
      return parseTomigaya(url, html)
    case 'www.sousaku-kukan.com':
      return parseTomigaya(url, html)
    case 'aoyama-fudousan.com':
      return parseTomigaya(url, html)
    case 'kagurazaka-fudousan.com':
      return parseTomigaya(url, html)
    case 'realestate.yahoo.co.jp':
      return parseYahoo(url, html)
    default:
      throw new Error('no scraper for this site')
  }
}
