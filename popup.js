function saveSettings(e) {
  e.preventDefault()
  var hiddenCols = []
  var stateSave = ($('#statesave').val() === 'true')
  var darkmode = ($('#darkmode').val() === 'true')
  var autorefresh = ($('#autorefresh').val() === 'true')
  var autorefreshtime = $('#autorefreshtime').val()
  var applySpecial = ($('#applySpecial').val() === 'true')

  $('input[name=columns]:checked').each(function(){
    hiddenCols.push($(this).val())
  })

  chrome.storage.sync.set({
    hiddenCols: hiddenCols,
    stateSave: stateSave,
    darkmode: darkmode,
    autorefresh: autorefresh,
    autorefreshtime: autorefreshtime,
    applySpecial: applySpecial
  },()=>{
    console.log("Saved settings:",hiddenCols,stateSave,darkmode,autorefresh,autorefreshtime,applySpecial)
    chrome.tabs.executeScript(null,{code:"settingsUpdated()"})
    window.close()
  })
}

function resetAll() {
  chrome.storage.sync.clear(()=>{
    chrome.storage.local.clear(()=>{
      chrome.tabs.executeScript(null,{code:"settingsUpdated()"})
      window.close()
    })
  })
}

function applyDarkmode() {
  $('body, .form-control').css({'backgroundColor':'#000','color':'#ddd'})
}
function clearDarkmode() {
  $('body, .form-control').css({'backgroundColor':'','color':''})
}

function renderFormCheck(name,ui) {
  return `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" id="column-${name}" name="columns" value="${name}"/>
      <label class="form-check-label" for="column-${name}">${ui}</label>
    </div>
  `
}

function renderFormCheckColumns(columns) {
  var html = ''

  html += `<div class="col">`
  for (let i=0;i<(columns.length/2);i++) {
    html += renderFormCheck(columns[i].name, columns[i].ui)
  }
  html += `</div>`

  html += `<div class="col">`
  for (let i=Math.ceil(columns.length/2);i<columns.length;i++) {
    html += renderFormCheck(columns[i].name, columns[i].ui)
  }
  html += `</div>`

  return html
}

var settings  = {} // Loads settings from localstore 
var database  = {} // Inits the database and loads data from localstore

Promise.all([ loadSettings(), new Database().load() , DOMReady()]).then((v)=>{
  settings = v[0]
  database = v[1]

  $('#form-check-inputs').html(renderFormCheckColumns(Workorder.columnsOfTable))

  var stateSave = (typeof(settings.stateSave) == 'undefined') ? 'false' : settings.stateSave
  var darkmode = (typeof(settings.darkmode) == 'undefined') ? 'false' : settings.darkmode
  var autorefresh = (typeof(settings.autorefresh) == 'undefined') ? 'true' : settings.autorefresh
  var autorefreshtime = (typeof(settings.autorefreshtime) == 'undefined') ? '10' : settings.autorefreshtime
  var applySpecial = (typeof(settings.applySpecial) == 'undefined') ? 'true' : settings.applySpecial
  var hiddenCols = (typeof(settings.hiddenCols) == 'undefined') ? ['warning','shortdesc','contractor'] : settings.hiddenCols
  
  $('#statesave').val(stateSave.toString())
  $('#darkmode').val(darkmode.toString())
  $('#autorefresh').val(autorefresh.toString())
  $('#autorefreshtime').val(autorefreshtime.toString())
  $('#applySpecial').val(applySpecial.toString())
  $('input[name=columns]').val(hiddenCols)

  if (darkmode) {
    applyDarkmode()
  } else {
    clearDarkmode()
  }


  $('form').on('submit',(e)=>saveSettings(e))
  $('#resetAll').on('click',()=>resetAll())
})