import ServiceHandler from './ServiceHandler'
import StringUtils from './utils/StringUtils'

StringUtils.initialize()

chrome.storage.local.get('enabled', data => {
  if (data.enabled) {
    const sh = new ServiceHandler()
    sh.execute()
  }
})
