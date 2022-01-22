class PageUtils {
  static insertUrl(url) {
    let element = document.getElementById('inputUrl')
    element.value = url
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    PageUtils.insertUrl(request.loadUrl)
})
