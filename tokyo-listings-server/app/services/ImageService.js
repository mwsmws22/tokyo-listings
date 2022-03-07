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

const displayYahoo = async (url, squareM) => {
  const htmlFiles = await glob(`${ARCHIVE}/*／${squareM}㎡*しならYahoo*.html`)
  let foundArchive = false

  const getImage = async (elem, f) => {
    let { src } = elem.attribs
    if (!src) {
      src = elem.attribs['data-src']?.slice(34)
      const folder = f.fileName().replace('.html', '_files')
      const filenames = (await glob(`${ARCHIVE + folder}/*`))
        .map(fz => fz.fileName())
        .filter(fn => fn.length > 50)
      const image = filenames.find(fn => src.includes(fn))
      if (image) {
        return `${serverDir + folder}/${image}`
      }
      throw new Error('error retrieving image via data-src attr')
    } else {
      src = src.slice(2)
      return serverDir + src
    }
  }

  const images = (
    await Promise.all(
      htmlFiles.flatMap(async f => {
        const fileText = fs.readFileSync(f, 'utf8')
        const urlSaved = fileText.match(/saved from url=.*\)(.*?)\s-->/)[1]
        if (urlSaved === url) {
          foundArchive = true
          const $ = cheerio.load(fileText)
          const elems = []
          $('.DetailCarouselMain__image__item').each((i, elem) => elems.push(elem))
          const imagez = await Promise.all(elems.map(elem => getImage(elem, f)))
          return Array.from(new Set(imagez))
        }
        return []
      })
    )
  ).flat()

  if (!foundArchive) {
    throw new Error(Errors.imagesNotFoundError)
  } else {
    return images
  }
}

const displayTomigaya = async url => {
  const tomigayaMost = await glob(`${ARCHIVE}/*賃貸専門*.html`)
  const tokyoDesigners = await glob(`${ARCHIVE}/*東京デザイナーズ生活*.html`)
  const sousakuKukan = await glob(`${ARCHIVE}/*創作空間*.html`)
  const htmlFiles = [...tomigayaMost, ...tokyoDesigners, ...sousakuKukan]
  let foundArchive = false

  const images = (
    await Promise.all(
      htmlFiles.flatMap(async f => {
        const fileText = fs.readFileSync(f, 'utf8')
        const urlSaved = fileText.match(/saved from url=.*\)(.*?)\s-->/)[1]
        if (urlSaved === url) {
          foundArchive = true
          const folder = f.replace('.html', '_files').fileName()
          const imagez = await glob(`${ARCHIVE}/${folder}/*_??.jpg`)
          const imagesMapped = imagez.map(i => i.replace(ARCHIVE, serverDir))
          return imagesMapped
        }
        return []
      })
    )
  ).flat()

  if (!foundArchive) {
    throw new Error(Errors.imagesNotFoundError)
  } else {
    return images
  }
}

const displayLifullHomes = async (url, squareM) => {
  const htmlFiles = await glob(`${ARCHIVE}/【ホームズ】*${squareM}㎡*.html`)
  let foundArchive = false

  const images = (
    await Promise.all(
      htmlFiles.flatMap(async f => {
        const fileText = fs.readFileSync(f, 'utf8')
        const urlSaved = fileText.match(/saved from url=.*\)(.*?)\s-->/)[1]
        if (urlSaved.includes(url)) {
          foundArchive = true
          const folder = f
            .fileName()
            .replace('.html', '_files')
            .replace('[', '*')
            .replace(']', '*')
          const imagez = await glob(`${ARCHIVE}${folder}/image*.php`)
          const imagesMapped = imagez.map(i => i.replace(ARCHIVE, serverDir))
          return imagesMapped
        }
        return []
      })
    )
  ).flat()

  if (!foundArchive) {
    throw new Error(Errors.imagesNotFoundError)
  } else {
    return images
  }
}

exports.getImagesFromListing = async listing => {
  const { hostname } = new URL(listing.url)

  switch (hostname) {
    case 'suumo.jp':
      return displaySuumo(listing.url)
    case 'www.athome.co.jp':
      return displayAtHome(listing.url)
    case 'www.realtokyoestate.co.jp':
      return displayRealTokyoEstate(listing.url)
    case 'sumaity.com':
      return displaySumaity(listing.url)
    case 'realestate.yahoo.co.jp':
      return displayYahoo(listing.url, listing.square_m)
    case 'tomigaya.jp':
      return displayTomigaya(listing.url)
    case 'tokyo-designers.com':
      return displayTomigaya(listing.url)
    case 'east-and-west.jp':
      return displayTomigaya(listing.url)
    case 'aoyama-fudousan.com':
      return displayTomigaya(listing.url)
    case 'www.sousaku-kukan.com':
      return displayTomigaya(listing.url)
    case 'kagurazaka-fudousan.com':
      return displayTomigaya(listing.url)
    case 'www.homes.co.jp':
      return displayLifullHomes(listing.url, listing.square_m)
    default:
      throw new Error(Errors.noImageFetcher)
  }
}
