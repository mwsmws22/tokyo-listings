import ServiceHandler from './ServiceHandler'
import StringUtils from './utils/StringUtils'
import HTMLElementUtils from './utils/HTMLElementUtils'

StringUtils.initialize()
HTMLElementUtils.initialize()

chrome.storage.local.get('enabled', data => {
  if (data.enabled) {
    const sh = new ServiceHandler()
    sh.execute()
  }
})
