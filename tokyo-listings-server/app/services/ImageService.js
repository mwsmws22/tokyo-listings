const glob = require('glob-promise')
const path = require('path')
const cheerio = require('cheerio')
const fs = require('fs')
const Errors = require('../utils/Errors')

const serverDir = 'http://localhost:8082/tokyo_apt/'
const { ARCHIVE } = process.env

const displaySuumo = async url => {
  const filters = [/_s\do.jpg$/, /_tca_o.jpg$/, /_tma_o.jpg$/]
  const vips = [/_co.jpg$/]
  const urlKey = url.match(/jnc_(.*?)\//)[1]

  const fileList = await glob(`${ARCHIVE}/*${urlKey}*/*o.jpg`)

  let files = fileList.filter(file => !filters.some(filter => filter.test(file)))
  files = files.sort((a, b) => (vips.some(vip => vip.test(a)) ? -1 : 1))
  files = files.map(f => serverDir + f.replace(ARCHIVE, ''))

  return files
}

const displayAtHome = async url => {
  const urlKey = url.match(/athome.co.jp\/chintai\/(.*?)\/$/)[1]

  const fileList = await glob(`${ARCHIVE}/*${urlKey}*/*_386x386_*.jpeg`)
  const files = fileList.map(f => serverDir + f.replace(ARCHIVE, '').replace('#', '%23'))

  return files
}

const displayRealTokyoEstate = async url => {
  const urlKey = url.match(/estate.php\?n=(.*?)$/)[1]

  const fileInDir = await glob(`${ARCHIVE}/*東京R不動産*/${urlKey}*_ORIG.jpg`)

  if (!fileInDir[0]) {
    throw new Error(Errors.imagesNotFoundError)
  }

  const dir = path.dirname(fileInDir[0])

  const fileList = await glob(`${dir}/*_ORIG.jpg`)
  const files = fileList.map(f => serverDir + f.replace(ARCHIVE, ''))

  return files
}

const displaySumaity = async url => {
  const altFilters = ['周辺']
  const urlKey = url.match(/prop_(.*?)\/$/)[1]

  const fileList = await glob(`${ARCHIVE}/*スマイティ*${urlKey}*/saved_resource*`)
  const htmlFile = (await glob(`${ARCHIVE}/*スマイティ*${urlKey}*.html`))[0]

  if (!htmlFile) {
    throw new Error(Errors.imagesNotFoundError)
  }

  const $ = cheerio.load(fs.readFileSync(htmlFile))

  const numOfImgs = Array.from($('#thumbnailInner').eq(0).children()).filter(
    li =>
      !altFilters.some(af =>
        String($(li).eq(0).children().eq(0).attr('alt')).includes(af)
      )
  ).length

  let files = fileList.map(f => serverDir + f.replace(ARCHIVE, ''))
  files.sort((a, b) => {
    let aId = a.match(/saved_resource\((.*?)\)$/)
    let bId = b.match(/saved_resource\((.*?)\)$/)
    aId = aId ? parseInt(aId[1]) : 0
    bId = bId ? parseInt(bId[1]) : 0
    return aId - bId
  })
  files = files.slice(3).slice(0, numOfImgs)

  return files
}

exports.getImagesFromUrl = async url => {
  const { hostname } = new URL(url)

  switch (hostname) {
    case 'suumo.jp':
      return displaySuumo(url)
    case 'www.athome.co.jp':
      return displayAtHome(url)
    case 'www.realtokyoestate.co.jp':
      return displayRealTokyoEstate(url)
    case 'sumaity.com':
      return displaySumaity(url)
    default:
      throw new Error(Errors.noImageFetcher)
  }
}
