function loadSettings() {
  chrome.storage.sync.get((settings) => { // Load the user's settings
    var stateSave = (typeof(settings.stateSave) == 'undefined') ? 'false' : settings.stateSave
    var darkmode = (typeof(settings.darkmode) == 'undefined') ? 'false' : settings.darkmode
    var autorefresh = (typeof(settings.autorefresh) == 'undefined') ? 'true' : settings.autorefresh
    var hiddenCols = (typeof(settings.hiddenCols) == 'undefined') ? [7,8] : settings.hiddenCols
    
    $('#statesave').val(stateSave.toString())
    $('#darkmode').val(darkmode.toString())
    $('#autorefresh').val(autorefresh.toString())
    $('input[name=columns]').val(hiddenCols)    

    if (darkmode) {
      applyDarkmode()
    } else {
      clearDarkmode()
    }
  });
}

function saveSettings(e) {
  e.preventDefault()
  var hiddenCols = []
  var stateSave = ($('#statesave').val() === 'true')
  var darkmode = ($('#darkmode').val() === 'true')
  var autorefresh = ($('#autorefresh').val() === 'true')

  $('input[name=columns]:checked').each(function(){
    hiddenCols.push(parseInt($(this).val()))
  })

  chrome.storage.sync.set({
    hiddenCols: hiddenCols,
    stateSave: stateSave,
    darkmode: darkmode,
    autorefresh: autorefresh
  },()=>{
    console.log("Lagret:",hiddenCols,stateSave,darkmode,autorefresh)
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

function applyDarkmode() {
  $('body, .form-control').css({'backgroundColor':'#000','color':'#ddd'})
}
function clearDarkmode() {
  $('body, .form-control').css({'backgroundColor':'','color':''})
}

$(function(){
  loadSettings()

  $('form').on('submit',(e)=>saveSettings(e))
  $('#resetAll').on('click',()=>resetAll())
})