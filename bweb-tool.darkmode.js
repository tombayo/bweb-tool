/**
 * Applies the Darkmode-theme according to the settings
 * @param {Object} settings 
 */
function applyDarkmode() {
  chrome.storage.sync.get((settings) => { // Load the user's settings
    let enable = (typeof(settings.darkmode) == 'undefined') ? false : settings.darkmode
    if (!enable) return null

    let darkcss = chrome.extension.getURL('bweb-tool-dark.css')

    if($(`link[href="${darkcss}"]`).length == 0) { // Check if stylesheet already is applied
      $('head').append(`<link rel="stylesheet" type="text/css" href="${darkcss}">`)
    }
  });
}

applyDarkmode()