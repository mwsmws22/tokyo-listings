class PageUtils {
  static insertUrl(url) {
    const element = document.getElementById('inputUrl')
    element.value = url
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

chrome.runtime.onMessage.addListener(request => {
  PageUtils.insertUrl(request.loadUrl)
})
