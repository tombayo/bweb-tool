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
  $('#content > form').hide(); // Hides the vanilla "filter" form
  $('#header span').first().hide(); // Removes the link "Hovedside", which is the same as the heading-link
  $('<div style="float:left"/>').append( // Creates a new Heading with link placed above navigation menu.
    $('<h2/>').css({marginBottom:'0px',marginTop:'1.5rem',display:'inline-block'}).append('<a href="/">Bestillingsweb</a>')
  ).insertAfter('#header > div:first');
  $('#header > div:last > b:last').hide().next().next().hide(); // removes back link
  $('#header > div:last').prepend( // Adds the space for feedbacks
    $('<span id="refresh-feedback">').css({fontStyle:'italic',fontSize:'12px'}),
    $('<b>&nbsp;|</b>')
  );
  $('#navigation > div:first > ul > li:last').remove(); // Removes the "Mangler Fakturanr" button.
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
    if (filter != 'mangler_dokumentasjon') {
      $(this).hide()
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
function initTable() {
  var table = $('<table id="bweb" width="100%" class="compact row-border hover"/>')
  var header = $('<thead/>')
    .css('display','table-row-group') // Styles the head to drop below footer
    .append('<tr/>') 
  var footer = $('<tfoot/>')
    .css('display','table-header-group') // Puts the footer on top of the table
    .append('<tr/>')
  
  for (col of Workorder.columnsOfTable) {
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
 * 
 * @argument callback function to run when init is complete
 */
function initDatatable(callback){
  $.fn.dataTable.moment('DD.MM.YYYY HH:mm'); // Prepare Moment.js for sorting datetime
  //$.fn.dataTable.moment('')
  var hiddencols = (typeof(settings.hiddenCols) == 'undefined') ? ["warning",'shortdesc','contractor'] : settings.hiddenCols

  return table.DataTable({
    stateSave: (typeof(settings.stateSave) == 'undefined') ? false : settings.stateSave, // Enables the state of the filters and sortings to be saved for the next session
    language: {"url":"//cdn.datatables.net/plug-ins/1.10.20/i18n/Norwegian-Bokmal.json"}, // Adds l10n
    order: [[ Workorder.columnNames.indexOf('url'), "desc" ]], // Selects the initial ordering of the table
    paging: false, // Defines if paging should be enabled
    autoWidth: false,
    searchDelay: 100,
    columns: Workorder.columnsOfTable,
    columnDefs: [ 
      {
          "targets": hiddencols.map(col=>Workorder.columnNames.indexOf(col)),
          "visible": false
      }
    ],
    //rowId: a=>{return 'id_'+a.url}, // Adds a unique ID to each row
    initComplete: callback
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
function dataUpdated() {
  datatable.rows().every(function(){
    let workorder = this.data()
    let rowcolor = workorder.rowcolor
    let row = this.node()
    if (rowcolor) {
      row.classList.add(rowcolor) // Colors the row based on it's rowcolor data
    }
    row.setAttribute('title', (typeof(workorder.description) === 'undefined')?workorder.shortdesc:workorder.description) // Adds the short desc. as a title to the row
  })

  $('#filter-unread > span').html(datatable.rows('.rowcolor-orange').count()); // Counts the orange rows and display in menu-button
}

/**
 * Applies a filter to the status column
 * 
 * @param {String} status 
 */
function filterStatus(status) {
  $('.chosen-select:last').val([status]).trigger('change').trigger('chosen:updated'); // Run the filter-change.
}

/**
 * Adds a loading-bar to the top of a table. Returns the <thead> inserted.
 * 
 * @param {string} tableid the id of the table
 */
function tableLoading() {
  var head = $('#bweb thead')
  var row = $(`<th colspan="${Workorder.columnsOfTable.length}">`).css({
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
 * Toggles the UI into, or out of loading state.
 * 
 * @param {Boolean} forceState Use to force a loading state on the UI
 */
function uiLoading(forceState) {
  loadingState = (typeof(loadingState) == "undefined")?true:loadingState // State not defined, starts with false
  loadingState = (typeof(forceState) == "undefined")?!loadingState:forceState // Toggle loadingState, or override by param
  if (loadingState) {
    btnLoad('#refresh-btn', 'Oppdaterer');
    $('#refresh-feedback').html('Venter på server...').attr('title',''); // clears the feedback-area
    $('.loading-slow').show()
  } else {
    $('#refresh-feedback').attr('title',$('#refresh-feedback').html())
    btnReady('#refresh-btn', 'Oppdater &#8635;')
    $('.loading-slow').hide()
  }
}

/**
 * Function that performs the ajax call to the current href.
 *  
 */
async function ajaxRefresh() {
  const response = await fetch(window.location.href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: $.param({
      csrfmiddlewaretoken: $('[name="csrfmiddlewaretoken"]').val(),
      kategori: '',
      antall: 'Alle',
    })
  })

  return response
}

/**
 * Loads the full table in background and refreshes the visible content.
 */
function backgroundRefresh() {
  uiLoading(true)  
  ajaxRefresh().then((response) => {
    if (response.status !== 200) { // Something went wrong
      console.log('AjaxStatus:', response.status);
      if (response.status === 0) { // No internet, possibly
        $('#refresh-feedback').html(new Date().toLocaleString() +' - Problemer med nett-tilkoblingen, vennligst prøv igjen...').addClass('bad-txt');
      } else {
        $('#refresh-feedback').html(new Date().toLocaleString() +' - Feilkode fra server: ' + response.status).addClass('bad-txt');
      }
    } else {
      response.text().then((data)=> {
        var html = parseTablesorterTable(data)

        if (html) { // check if we have a table in the data
          database.update(html).clean().save() // updates the database, cleans it for old stuff, and saves it to localstore

          $('#refresh-feedback').html(new Date().toLocaleString() + ' - Oppdatert!').removeClass('bad-txt').addClass('good-txt');
        } else { // No table usually means logged out user
          $('#refresh-feedback').html(new Date().toLocaleString() + ' - Det ser ut som at du har blitt logget ut, last inn siden på nytt og prøv igjen...').addClass('bad-txt');
        }
      })
    }
  })
}

/**
 * Updates the filter options based on table data.
 * 
 * @todo Use Datatable count() to update the numbers in nav.
 * 
 * @param {DataTable} datatable datatable api
 * @param {Object} settings 
 */
function refreshFilters() {
  var colarr = Workorder.columnsToFilter // An array of all the columns to apply filter to
  var applySpecial = (typeof(settings.applySpecial) == 'undefined') ? true : settings.applySpecial

  if(applySpecial) {
    refreshMunicipalityFilter('location:name') // Refreshes our special municipality filter
  } else {
    if (!colarr.includes('location:name')) {
      colarr.push('location:name')
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
function refreshMunicipalityFilter(column) {
  var col = datatable.column(column);
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

function initFilters() {
  var colarr = Workorder.columnsToFilter // An array of all the columns to apply filter to
  var applySpecial = (typeof(settings.applySpecial) == 'undefined') ? true : settings.applySpecial
  
  if (applySpecial) {
    var col = datatable.column('location:name'); // Custom filtering for postal town/municipality column
    $('<select data-placeholder="Kommune.." class="chosen-select" multiple><option value="">Alle</option></select>')
      .appendTo( $(col.footer()).empty() )
      .on('change', function() {
        var val = $(this).val().map(function(muni){ // Converts municipalities to all towns within
          return mapReverseLookup(poststed, muni).map(val => val[0]).join('$|^');
        }).join('$|^');
        col.search( val ? '^'+val+'$' : '', true, false ).draw();
      });
  } else {
    colarr.push('location:name')
  }

  datatable.columns(colarr).every( function () { // Prepares the column filters
    var column = this;
    $('<select data-placeholder="Filter.." class="chosen-select" multiple><option value="">Alle</option></select>')
      .appendTo( $(column.footer()).empty() )
      .on( 'change', function () {
        var val = $(this).val().join('|');
        column.search( val ? '^'+val+'$' : '', true, false ).draw();
      });
  });

  tableLoading() // Adds the loadingbar to the table

  // Moves the filter search field to the navbar
  $('#bweb_filter')
    .appendTo('#navigation')
    .css({float:'left',marginBottom:'0px'})
    .find('input')
      .addClass('nav-item')
      .height($('li > a').first().height())
      .css('max-width','150px')
      .attr('placeholder','Søk i tabell...')
      .attr('title', 'Søk i tabellen under.')
      .appendTo('#bweb_filter')
      .siblings('label').remove();
  $('#bweb_filter').prepend('<span class="nav-item">'); // Adds some space

  $('#filter-unread').on('click',function(){
    var $btn = $(this);
    if ($btn.is('.toggled')) {
      datatable.rows(':not(.rowcolor-orange)').nodes().each(function(e){$(e).show()});
    } else {
      datatable.rows(':not(.rowcolor-orange)').nodes().each(function(e){$(e).hide()});
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
  let tbl       = tbldoc.querySelector("#oversikt") // Find the table

  return (tbl)?[...tbl.tBodies[0].rows].map(r => [...r.cells].map(c => c.innerText)):false
}

/**
 * Updates the Datatable with data from the database
 * 
 * @param {Object} settings 
 * @param {DataTable} dt 
 * @param {Database} database
 */
function updateDatatable() {
  let archived = (window.location.pathname.replace(/[/]/gi,'') == 'arkivert')
  datatable.clear().rows.add(database.toArray(archived)).draw() // Feeds the datatable with database data.   
}

var   datatable = {} // Prepares our global var for the DataTable, will be initialized later
var   settings  = {} // Loads settings from localstore 
var   database  = {} // Inits the database and loads data from localstore
const table     = initTable() // Initialize the table to hold our data and to later load DataTables onto


Promise.all([ loadSettings(), new Database().load() , DOMReady()]).then((v)=>{
  settings = v[0] // Value returned from loadSettings()-promise is stored in the global var settings
  database = v[1] // Value returned from Database().load()-promise

  database.addEventListener('update',()=>{ // Listens for an update to the DB to update visuals
    updateDatatable()
    dataUpdated() // Data has been added to the table, this triggers more data-handling.
    refreshFilters()
    uiLoading(false)
  })

  let html = parseTablesorterTable($('#oversikt').hide().parent().html())

  table.insertBefore('#oversikt') // Inserts datatable to DOM
  uiBooster() // Style and DOM mods
  backgroundRefresh() // Fires a refresh of the table in the background, this is to load the rest of the table.

  datatable = initDatatable(()=>{ // Inits DataTable
    initFilters()
    initChosen()
    refreshFilters() // Refresh the table's filters, Chosen must be initialized first
  })

  database.update(html).save() // Update the database with stock table data
  
  var autorefresh = (typeof(settings.autorefresh) == 'undefined') ? true : settings.autorefresh
  var autorefreshtime = (typeof(settings.autorefreshtime) == 'undefined') ? '10' : settings.autorefreshtime
  if (autorefresh) {
    setInterval(backgroundRefresh, parseInt(autorefreshtime)*60*1000) // Refresh table
  }
})