var x = true

enableBrowserAction()

function disableBrowserAction() {
  chrome.browserAction.setIcon({path: './icons/logo16_dark.png'})
  chrome.storage.local.set({enabled: false})
}

function enableBrowserAction() {
  chrome.browserAction.setIcon({path: './icons/logo16_light.png'})
  chrome.storage.local.set({enabled: true})
}

function updateState() {
  if (x == false) {
    x = true
    enableBrowserAction()
  } else {
    x = false
    disableBrowserAction()
  }
  chrome.tabs.reload()
}

chrome.browserAction.onClicked.addListener(updateState)
