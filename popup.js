function loadSettings() {
  chrome.storage.sync.get((settings) => { // Load the user's settings
    var stateSave = (settings.stateSave) ? 'true' : 'false'
    var hiddenCols = (typeof(settings.hiddenCols) == 'undefined') ? [6] : settings.hiddenCols
    
    $('#statesave').val(stateSave)
    $('input[name=columns]').val(hiddenCols)

  });
}

function saveSettings(e) {
  e.preventDefault()
  var hiddenCols = []
  var stateSave = ($('#statesave').val() === 'true')

  $('input[name=columns]:checked').each(function(){
    hiddenCols.push(parseInt($(this).val()))
  })

  chrome.storage.sync.set({
    hiddenCols: hiddenCols,
    stateSave: stateSave
  },()=>{
    console.log("Lagret:",hiddenCols,stateSave)
    chrome.tabs.executeScript(null,{code:"settingsUpdated()"})
    window.close()
  })
}

function resetAll() {
  chrome.storage.sync.clear(()=>{
    chrome.tabs.executeScript(null,{code:"settingsUpdated()"})
    window.close()
  })
}

$(function(){
  loadSettings()

  $('form').on('submit',(e)=>saveSettings(e))
  $('#resetAll').on('click',()=>resetAll())
})