const https = require('https')
const http = require('http')
const Scraper = require('../utils/Scraper')

// for writing out html to file
// const fs = require('fs');
// fs.writeFileSync('test.html', html, {'encoding': 'utf-8'});

const scrape = (url, cb) => {
  let pass
  const useHeaders = [
    'www.renov-depart.jp',
    'www.chintai.net',
    'house.goo.ne.jp',
    'www.aeras-group.jp',
    'www.hatomarksite.com',
    'house.ocn.ne.jp',
    'www.rehouse.co.jp'
  ]
  const { protocol, hostname, pathname } = new URL(url)
  const adapter = protocol === 'https:' ? https : http

  if (useHeaders.includes(hostname)) {
    pass = {
      hostname,
      path: pathname,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
      }
    }
  } else {
    pass = url
  }

  const req = adapter.get(pass, res => {
    let html = ''
    const { statusCode } = res

    if (statusCode !== 200) {
      cb('bad link')
    } else {
      res.setEncoding('utf8')

      res.on('data', chunk => {
        html += chunk
      })

      res.on('end', async () => {
        try {
          const output = await Scraper.scrape(url, hostname, html)
          cb(output)
        } catch (err) {
          cb('bad link')
        }
      })
    }
  })

  req.end()
  req.on('error', e => {
    console.error(e)
  })
}

module.exports = {
  scrape
}
