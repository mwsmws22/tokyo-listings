export default class LoaderGoogle {
  constructor() {
    this.pipeline = ['filter scrapeable results']
    this.badHosts = new Set([
      'www.google.com',
      'translate.google.com',
      'webcache.googleusercontent.com'
    ])
    this.scrapedElems = []
  }

  execute() {
    const results = Array.from(
      document.getElementById('search').children[0].children[1].children
    ).filter(elem => elem.localName == 'div' && elem.className != 'ULSxyf')

    results.forEach(div => {
      this.scrapedElems.push({
        hostnames: new Set(
          Array.from(div.getElementsByTagName('a'))
            .map(elem => new URL(elem.href).hostname)
            .filter(host => !this.badHosts.has(host))
        ),
        searchResultElem: div
      })
    })
  }
}
