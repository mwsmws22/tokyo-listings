const glob = require('glob-promise')
const path = require('path')
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

exports.getImagesFromUrl = async url => {
  const { hostname } = new URL(url)

  switch (hostname) {
    case 'suumo.jp':
      return displaySuumo(url)
    case 'www.athome.co.jp':
      return displayAtHome(url)
    case 'www.realtokyoestate.co.jp':
      return displayRealTokyoEstate(url)
    default:
      throw new Error(Errors.noImageFetcher)
  }
}
