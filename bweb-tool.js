/**
 * Main Script of the extension
 */

/**
 * Applies various style and DOM improvements
 * 
 * @param {Object} settings 
 */
function uiBooster() {
  $('#content > h2').hide(); // Hides the standard heading
  $('#content > form').hide(); // Hides the horrible "filter" form
  //$('#header img').first().attr('src','https://nte.no/_/asset/no.smartlabs.nte:1581893708/dist/images/nte-logo.svg') // Replace logo for a transparent one
  $('#header span').first().hide(); // Removes the link "Hovedside", which is the same as the heading-link
  $('<div style="float:left"/>').append( // Creates a new Heading with link placed above navigation menu.
    $('<h2/>').css({marginBottom:'0px',marginTop:'1.5rem',display:'inline-block'}).append('<a href="/">Bestillingsweb</a>')
  ).insertAfter('#header > div:first');
  $('#header > div:last > b:last').hide().next().next().hide(); // removes back link
  $('#header > div:last > b:last')[0].nextSibling.remove(); // removes search field label
  $('#header > div:last').prepend( // Adds the space for feedbacks
    $('<span id="refresh-feedback">').css({fontStyle:'italic',fontSize:'12px'}),
    $('<b>&nbsp;|</b>')
  );
  $('#navigation > div:last > ul > li:first').remove(); // Removes the vanilla search button, replaced with another one below.
  $('#navigation > div:first > ul > li:last').remove(); // Removes the "Mangler Fakturanr" button.
  $('#header form')  // Moves the search-field and -button to be inline in the navbar
    .appendTo(
      $('<div>')
      .css({float:'right'})
      .appendTo('#navigation'))
    .addClass('nav-item')
    .children()
      .addClass('nav-item')
      .css({width:'3em'})
      .attr('placeholder','Refnr...')
      .attr('title', 'Skriv inn refnr for å gå direkte til ordre.')
      .last()
        .replaceWith('<button type="submit" class="nav-item">Søk</button>');
  $('#content > span.secret').hide(); // removes row-count at bottom of table
  $('#navigation > div:first').after( // Adds button for refreshing table and sorting by unread comments.
    $('<div>').css({float:'left'}).append(
      $('<button id="filter-unread" type="button" title="Ordrer med uleste kommentarer.">Uleste (<span>0</span>)</button>')
        .addClass('nav-item'),
      $('<span>').addClass('nav-item'),
      $('<button id="refresh-btn" type="button">Oppdater</button>').addClass('nav-item').on('click',function(){
        if (!$(this).prop('disabled')) { // check if button is disabled, to prevent double loading
          backgroundRefresh();
        }
      })
    )
  );

  $('.nav-item').height($('li > a').first().height()); // Makes sure the height of the items are the same

  /**
   * Below code changes the links to apply filters instead of loading new pages/tables.
   */ 
  $('#navigation > div:first a').each(function() {
    var filter = $(this).attr('href').replace(/[^\w\s]/gi, '');
    if (window.location.pathname.replace(/[/]/gi, '') === 'arkivert') {
      $(this).attr('href',$(this).attr('href').replace(/[/]/gi, '/#'));
    } else {
      $(this).attr('href','#').on('click', function(){
        filterStatus(filter);
      });
    }
  });
}

/**
 * Duplicate table to remove tablesorter, and adds a tfoot for the filter fields.
 * 
 * Ideally we'd just kill the tablesorter addon, but website runs an older version of 
 * tablesorter which does not support any such functionality. 
 * 
 * @param {Array} columns Array of the columns to add to the table
 */
function initTable(columns) {
  var table = $('<table id="bweb" width="100%" class="compact row-border hover"/>')
  var header = $('<thead/>')
    .css('display','table-row-group') // Styles the head to drop below footer
    .append('<tr/>') 
  var footer = $('<tfoot/>')
    .css('display','table-header-group') // Puts the footer on top of the table
    .append('<tr/>')
  
  for (col of columns) {
    header.find('tr').append($('<th/>').html(col.ui))
    footer.find('tr').append('<th>')
  }

  table.append(header,'<tbody/>',footer)
  
  return table
}

/**
 * Takes the raw HTML string used for datatables, and applies some string transforms to it
 */
function rawHTMLfix(string) {
  return string
    .toLowerCase()
    .replace(/<!--<td>/g,'<td>')
    .replace(/<\/td>-->/g, '</td>')
    .replace( '<th>adresse</th>',
              '<th>adresse</th>\n<th>beskrivelse</th>')
    .replace(/style="background-color: #f6f6f6;">/g,'class="rowcolor-header"><td>rowcolor-header</td>')
    .replace(/style="background-color: #facb8e;">/g,'class="rowcolor-orange"><td>rowcolor-orange</td>')
    .replace(/style="background-color: #aaeeff;">/g,'class="rowcolor-blue"><td>rowcolor-blue</td>')
    .replace(/style="background-color: #fcff9e;">/g,'class="rowcolor-yellow"><td>rowcolor-yellow</td>')
    .replace(/<td title="">/g,'<td></td><td>')
}

/**
 * Sets up DataTable on #bweb
 */
function initDatatable(table, settings, columns){
  return new Promise((resolve) => {
    $.fn.dataTable.moment('DD.MM.YYYY HH:mm'); // Prepare Moment.js for sorting datetime
    table.DataTable({
      stateSave: (typeof(settings.stateSave) == 'undefined') ? false : settings.stateSave, // Enables the state of the filters and sortings to be saved for the next session
      language: {"url":"//cdn.datatables.net/plug-ins/1.10.20/i18n/Norwegian-Bokmal.json"}, // Adds l10n
      //order: [[ 1, "desc" ]], // Selects the initial ordering of the table
      paging: false, // Defines if paging should be enabled
      columns: columns,
      columnDefs: [ 
        {
            "targets": (typeof(settings.hiddenCols) == 'undefined') ? [7,8] : settings.hiddenCols,
            "visible": false
        }
      ],
      initComplete: function(){
        resolve(this.api())
      }
    })
  })
}

/**
 * Simply disables a button and adds a loading animation on it.
 * 
 * @param {String} id jQuery selector for button
 * @param {String} text text to put into the buttion
 */
function btnLoad(id,text) {
  var btn = $(id);
  btn.prop('disabled', true).html(text+'<span>.</span><span>.</span><span>.</span>').addClass('loading').height($('li > a').first().height());
}

/**
 * Removes loading animation and resets a button for use again.
 * 
 * @param {String} id jQuery selector for button
 * @param {String} text text to put into the button
 */
function btnReady(id,text) {
  var btn = $(id);
  btn.prop('disabled', false).html(text).removeClass('loading').height($('li > a').first().height());
}

/**
 * Runs when DataTable is fully loaded, hence used to do stuff with DataTable
 */
function initChosen() {
  /** Code below is very blocking, async somehow */
  $('.chosen-select').chosen({width: "-webkit-fill-available"}); // Applies Chosen to the select-fields.

  if (window.location.hash) { // a hash is used to imply a filter on pageload, lets activate it
    $('.chosen-select:last')
      .val([window.location.hash.replace(/[#]/, '')])
      .trigger('change')
      .trigger('chosen:updated'); // Run the filter-change.
  }
}

/**
 * Runs when data in the datatables has been updated, either from a refresh or a pageload.
 * 
 * @param {DataTable} datatable datatable api
 */
function dataUpdated(dt) {
  dt.rows().every(function(){
    this.$().attr('title',this.data()[7]) // Adds the short desc. as a title to the row
  })

  $('[data-rowcolor][data-rowcolor!=""]').each(function(){ // Finds cells with data-rowcolor
    $(this).parents('tr').addClass($(this).data('rowcolor')) // Colors the row
  })  
  $('#filter-unread > span').html(dt.rows('.rowcolor-orange').count()); // Counts the orange rows and display in menu-button
}

/**
 * Extension's settings was updated, lets update the page etc.
 */
function settingsUpdated() {
  document.location.reload()
}

/**
 * Applies a filter to the status column
 * 
 * @param {String} status 
 */
function filterStatus(status) {
  
}

/**
 * Adds a loading-bar to the top of a table. Returns the <thead> inserted.
 * 
 * @param {string} tableid the id of the table
 */
function tableLoading(tableid) {
  var head = $(tableid + ' thead');
  var row = $('<th colspan="11">').css({
    borderBottom:'0',
    letterSpacing:'20px',
    textAlign:'center'
  });
  $('<span>&bull;</span>'.repeat(10)).appendTo(row);

  var newhead = $('<thead>')
    .addClass('loading-slow')
    .css({display:'table-row-group'})
    .append($('<tr>').append(row));
  
  head.after(newhead);

  return newhead;
}

/**
 * A fix for a bug with firefox
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1322113
 * @see https://discourse.mozilla.org/t/webextension-xmlhttprequest-issues-no-cookies-or-referrer-solved/11224/7
 */
function getXMLHttp(){
  try {
     return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
  }
  catch(evt){
     return new XMLHttpRequest();
  }
}

/**
 * Function that performs the ajax call to the current href.
 * Runs the supplied callback function "whensuccess" on success
 * 
 * @param {Function} whensuccess 
 */
function ajaxRefresh(whensuccess) {
  var xhr = getXMLHttp();
  xhr.onreadystatechange = function(){
    if(this.readyState == XMLHttpRequest.DONE) {
      whensuccess(this.responseText, this.status);
    }
  }  
  xhr.open("POST", window.location.href, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  //xhr.withCredentials = true;
  xhr.send($.param({
    csrfmiddlewaretoken: $('[name="csrfmiddlewaretoken"]').val(),
    kategori: '',
    antall: 'Alle',
  }));
}

/**
 * Loads the full table in background and refreshes the visible content.
 */
function backgroundRefresh(settings) {
  btnLoad('#refresh-btn', 'Oppdaterer');
  $('#refresh-feedback').html('Venter på server...').attr('title',''); // clears the feedback-area
  $('.loading-slow').show()
  ajaxRefresh(function(data, status){
    var html = $($.parseHTML(rawHTMLfix(data))).find('#oversikt tbody');

    if (status !== 200) { // Something went wrong
      console.log('AjaxStatus:', status);
      if (status === 0) { // No internet, possibly
        $('#refresh-feedback').html(new Date().toLocaleString() +' - Problemer med nett-tilkoblingen, vennligst prøv igjen...').addClass('bad-txt');
      } else {
        $('#refresh-feedback').html(new Date().toLocaleString() +' - Feilkode fra server: ' + status).addClass('bad-txt');
      }
    } else if (html.children().length == 0) { // We have a response, but we have no table data, normally due to expired login.
      $('#refresh-feedback').html(new Date().toLocaleString() + ' - Det ser ut som at du har blitt logget ut, last inn siden på nytt og prøv igjen...').addClass('bad-txt');
    } else { // Everything checks out, lets feed data into the table
      var rows = html.children();
      var tbl = $('#bweb').DataTable().clear();
      for (row of rows) {
        tbl.row.add(row);
      }
      dataUpdated(tbl); // Data is now updated, lets run this to trigger any additional work on the data.

      $('#refresh-feedback').html(new Date().toLocaleString() + ' - Oppdatert!').removeClass('bad-txt').addClass('good-txt');
    }
    $('#refresh-feedback').attr('title',$('#refresh-feedback').html());
    btnReady('#refresh-btn', 'Oppdater &#8635;');
    $('.loading-slow').hide()
  });

  var autorefresh = (typeof(settings.autorefresh) == 'undefined') ? true : settings.autorefresh
  var autorefreshtime = (typeof(settings.autorefreshtime) == 'undefined') ? '10' : settings.autorefreshtime
  if (autorefresh) {
    setTimeout(()=>backgroundRefresh(settings), parseInt(autorefreshtime)*60*1000) // Refresh table after 5 mins
  }


}

/**
 * Updates the filter options based on table data.
 * 
 * @todo Use Datatable count() to update the numbers in nav.
 * 
 * @param {DataTable} datatable datatable api
 * @param {Object} settings 
 */
function refreshFilters(settings, datatable) {
  var colarr = [9,10,11,12,13] // An array of all the columns to apply filter to
  var applySpecial = (typeof(settings.applySpecial) == 'undefined') ? true : settings.applySpecial

  if(applySpecial) {
    refreshMunicipalityFilter(datatable, 5) // Refreshes our special municipality filter
  } else {
    if (!colarr.includes(5)) {
      colarr.push(5)
    }
  }

  datatable.columns(colarr).every( function () { 
    var column = this;
    var select = $(column.footer()).find('select').empty().append('<option value="">Alle</option>'); // Clears the select to re-add based on new column data

    column.data().unique().sort().each( function ( d, j ) {
      if (!d) { return; }  // If value is empty, we dont want it as an option

      var searchval = column.search().replace(/[^\w\s/|ÆØÅæøå]/gi, '');
      if(searchval.indexOf(d) !== -1){
        select.append( '<option value="'+d+'" selected="selected">'+d+'</option>' )
      } else {
        select.append( '<option value="'+d+'">'+d+'</option>' )
      }
    });

    select.trigger("chosen:updated"); // Content of select updated, lets notify chosen to redraw.
  });

}

/**
 * Applies the municipality filter to the desired column
 * 
 * @param {DataTables} dt 
 * @param {Integer} column 
 */
function refreshMunicipalityFilter(dt, column) {
  var col = dt.column(column);
  var sel = $(col.footer()).find('select').empty().append('<option value="">Alle</option>');
  var municipalities = [];

  col.data().unique().sort().each( function (d, j) { // Build the array of municipalities based the towns
    if (typeof(poststed[d]) === 'undefined') { // Place doesn't exist, usually a typo
       poststed[d] = 'ukjente'; // put all unknowns into a fake municipality
    }
    if (municipalities.indexOf(poststed[d]) === -1) {
      municipalities.push(poststed[d]);
    }
  });
  var searchval = col.search().replace(/[^\w\s/|ÆØÅæøå]/gi, '').split('|'); // Removes special chars in the search-string that is applied to column
  for (muni of municipalities.sort()) {
    var places = mapReverseLookup(poststed, muni); // finds all towns for a municipality
    var inarr = false;

    for (place of places) { // Checks if search-string contains any of the towns for this municipality
      if (searchval.indexOf(place[0]) !== -1) {
        inarr = true;
        break;
      }
    }
    if(inarr){ // if so put the municipality as selected.
      sel.append( '<option value="'+muni+'" selected="selected">'+muni+'</option>' )
    } else {
      sel.append( '<option value="'+muni+'">'+muni+'</option>' )
    }
  }

  sel.trigger("chosen:updated");
}

function mapReverseLookup(objmap, search) {
  return Object.entries(objmap).filter(function (pair){
    return pair[1] == search;
  });
}

function loadSettings() {
  return new Promise((resolve,reject) => {
    chrome.storage.sync.get((response) => {
      resolve(response)
    })
  })
}

function initFilters(settings,dt) {
  var colarr = [9,10,11,12,13] // An array of all the columns to apply filter to
  var applySpecial = (typeof(settings.applySpecial) == 'undefined') ? true : settings.applySpecial
  
  if (applySpecial) {
    var col = dt.column(5); // Custom filtering for column 5 (postal town/municipality)
    $('<select data-placeholder="Kommune.." class="chosen-select" multiple><option value="">Alle</option></select>')
      .appendTo( $(col.footer()).empty() )
      .on('change', function() {
        var val = $(this).val().map(function(muni){ // Converts municipalities to all towns within
          return mapReverseLookup(poststed, muni).map(val => val[0]).join('$|^');
        }).join('$|^');
        col.search( val ? '^'+val+'$' : '', true, false ).draw();
      });
  } else {
    colarr.push(5)
  }

  dt.columns(colarr).every( function () { // Prepares the column filters
    var column = this;
    $('<select data-placeholder="Filter.." class="chosen-select" multiple><option value="">Alle</option></select>')
      .appendTo( $(column.footer()).empty() )
      .on( 'change', function () {
        var val = $(this).val().join('|');
        column.search( val ? '^'+val+'$' : '', true, false ).draw();
      });
  });

  tableLoading('#bweb').hide() // Adds the loadingbar to the table, then hides it

  // Moves the filter search field to the navbar
  $('#bweb_filter')
    .appendTo('#navigation')
    .css({float:'right',marginBottom:'0px'})
    .find('input')
      .addClass('nav-item')
      .height($('li > a').first().height())
      .css('max-width','150px')
      .attr('placeholder','Søk i tabell...')
      .attr('title', 'Søk i tabellen under.')
      .appendTo('#bweb_filter')
      .siblings('label').remove();
  $('#bweb_filter').append('<span class="nav-item">'); // Adds some space

  $('#filter-unread').on('click',function(){
    var $btn = $(this);
    var dt = $('#bweb').DataTable();
    if ($btn.is('.toggled')) {
      dt.rows(':not(.rowcolor-orange)').nodes().each(function(e){$(e).show()});
    } else {
      dt.rows(':not(.rowcolor-orange)').nodes().each(function(e){$(e).hide()});
    }
    $btn.toggleClass('toggled');
  });
}

/**
 * Converts a raw html string into an array based on the containing table.
 * 
 * Searches for table#oversikt within the string and extracts the data to an array. 
 * Uses the @see rawHTMLfix function on the string before searching.
 * 
 * @param {String} htmlstring A raw html string containing the tablesorter Table
 * @returns {Array} An array extracted from the table data.
 */
function parseTablesorterTable(htmlstring) {
  let tblstart  = htmlstring.indexOf('<table id="oversikt"') // Find the table
  let tblend    = htmlstring.indexOf('</table>', tblstart) // find the next end tag
  let tblstring = rawHTMLfix(htmlstring.slice(tblstart, tblend)) // Slice out the table
  let tbldoc    = new DOMParser().parseFromString(tblstring, 'text/html') // Parse the HTML 

  return [...tbldoc.querySelector("#oversikt").tBodies[0].rows].map(r => [...r.cells].map(c => c.innerText))

}

/**
 * Doc Ready!
 */
const DOMready = (f)=>(document.readyState === 'complete')?f():document.addEventListener('DOMContentLoaded',f,false)

const settings = loadSettings() // Loads settings from localstore (Async)
const database = new Database().load() // Inits the database and loads data from localstore (Sync)
const table = initTable(database.columns) // Initialize the table to hold our data and to later load DataTables onto (Sync)

DOMready(()=>{
  table.insertBefore('#oversikt') // Inserts datatable to DOM (Sync)
  uiBooster() // Style and DOM mods (Sync)
  database.update(parseTablesorterTable($('#oversikt').parent().html())).save() // Update the database with stock table data (Sync)
  
  const dt = initDatatable(table, settings, database.columns).then((dt)=>{ // Inits DataTable (Async)
    initFilters(settings, dt) // Prepares the filters to the table (Sync)
    table.data(database.data) // Feeds the table with database data. (Sync)
    //dataUpdated(dt) // Data has been added to the table, this triggers more data-handling. (Sync)
    dt.draw(); // Render the table
  })
  
  initChosen() // Inits the Chosen addon to our select-fields (Sync)

  refreshFilters(settings, dt) // Refresh the table's filters, Chosen must be initialized (Sync)
  
  backgroundRefresh(settings) // Fires a refresh of the table in the background, this is to load the rest of the table. (Async)
  
})