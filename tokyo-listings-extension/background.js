var x = true

enableBrowserAction()

function disableBrowserAction() {
  chrome.storage.local.set({enabled: false})
}

function enableBrowserAction() {
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
