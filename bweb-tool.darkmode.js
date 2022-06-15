/**
 * Applies the Darkmode-theme according to the settings
 * @param {Object} settings 
 */
function applyDarkmode() {
  chrome.storage.sync.get((settings) => { // Load the user's settings
    let enable = (typeof(settings.darkmode) == 'undefined') ? false : settings.darkmode
    if (!enable) return null

    let darkcss = chrome.runtime.getURL('bweb-tool-dark.css')

    if(document.querySelector(`link[href="${darkcss}"]`) === null) { // Check if stylesheet already is applied
      let link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = darkcss
      document.head.append(link)
    }
  });
}

applyDarkmode()