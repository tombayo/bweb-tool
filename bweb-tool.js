/**
 * Main Script of the extension
 */

/**
 * Applies various style and DOM improvements
 * 
 * @param {Object} settings 
 */
function uiBooster(settings) {
  applyDarkmode(settings); // Applies darkmode, if settings allows it

  $('#content > h2').hide(); // Hides the standard heading
  $('#content > form').hide(); // Hides the horrible "filter" form
  $('#header img').first().attr('src','https://nte.no/_/asset/no.smartlabs.nte:1581893708/dist/images/nte-logo.svg') // Replace logo for a transparent one
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
          backgroundRefresh(settings);
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
 * Applies the Darkmode-theme
 * @param {Object} settings 
 */
function applyDarkmode(settings) {
  let enable = (typeof(settings.darkmode) == 'undefined') ? false : settings.darkmode
  if (!enable) return null

  let darkcss = chrome.extension.getURL('bweb-tool-dark.css')

  if($(`link[href="${darkcss}"]`).length == 0) { // Check if stylesheet already is applied
    $('head').append(`<link rel="stylesheet" type="text/css" href="${darkcss}">`)
  }
}

function parseRowColors(dt) {
  dt.rows('[style^="background-color"]').every(function(index){ // Every colored row
    var color = ''
    switch (this.node().style.backgroundColor) {
      case 'rgb(252, 255, 158)': // #fcff9e
        color = 'yellow'
        break
      case 'rgb(170, 238, 255)': // #aaeeff
        color = 'blue'
        break
      case 'rgb(250, 203, 142)': // #facb8e
        color = 'orange'
        break
      case 'rgb(246, 246, 246)': // #f6f6f6
      default:
        color = 'header'
    }

    this.node().style.backgroundColor = '' // remove stylized background color
    this.node().classList.add('rowcolor-'+color) // Adds a class to color the row
    var celldata = $(this.cell(index,0).data()).attr('data-rowcolor','rowcolor-'+color)[0].outerHTML
    this.cell(index,0).data(celldata) // Updates the cells actual data, not just visuals.

  })
}

/**
 * Duplicate table to remove tablesorter, and adds a tfoot for the filter fields.
 * 
 * Ideally we'd just kill the tablesorter addon, but website runs an older version of 
 * tablesorter which does not support any such functionality. 
 */
function tableFix() {
  var newtable = $('<table id="bweb" width="100%" class="compact row-border hover">')
  .html(rawHTMLfix($('#oversikt').html()));
  $('<tfoot/>')
    .html($(newtable).find('thead').html())
    .css('display','table-header-group')
    .appendTo(newtable);
  newtable.find('thead').css('display','table-row-group'); // Styles the head to drop below footer
  newtable.find('tfoot th').removeClass('header').html(''); // Clears the content of the cells copied from thead
  newtable.insertBefore('#oversikt');
  $('#oversikt').remove(); // Remove original table (has tablesorter active on it)
}

/**
 * Takes the raw HTML string used for datatables, and applies some string transforms to it
 */
function rawHTMLfix(string) {
  return string
    .toLowerCase()
    .replace(/<!--|-->/g,'')
    .replace( '<th class="header">adresse</th>',
              '<th class="header">adresse</th>\n<th class="header">beskrivelse</th>')
}

/**
 * Sets up DataTable on #bweb
 */
function initDatatable(settings){
  $.fn.dataTable.moment('DD.MM.YYYY HH:mm'); // Prepare Moment.js for sorting datetime
  $('#bweb').DataTable({
    "stateSave": (typeof(settings.stateSave) == 'undefined') ? false : settings.stateSave, // Enables the state of the filters and sortings to be saved for the next session
    "language": {"url":"//cdn.datatables.net/plug-ins/1.10.16/i18n/Norwegian-Bokmal.json"}, // Adds l10n
    "order": [[ 1, "desc" ]], // Selects the initial ordering of the table
    "paging": false, // Defines if paging should be enabled
    "deferRender": true, // Should improve performance slightly
    "columnDefs": [ // Column number 6 is set to be invisible
      {
          "targets": (typeof(settings.hiddenCols) == 'undefined') ? [7,8] : settings.hiddenCols,
          "visible": false
      }
    ],
    initComplete: function () {
      this.api().columns([2,4,6,8,9,10,11,12,13]).every( function () { // Prepares the column filters
        var column = this;
        $('<select data-placeholder="Filter.." class="chosen-select" multiple><option value="">Alle</option></select>')
          .appendTo( $(column.footer()).empty() )
          .on( 'change', function () {
            var val = $(this).val().join('|');
            column.search( val ? '^'+val+'$' : '', true, false ).draw();
          });
      });
      
      var col4 = this.api().column(5); // Custom filtering for column 4 (postal town/municipality)
      $('<select data-placeholder="Kommune.." class="chosen-select" multiple><option value="">Alle</option></select>')
        .appendTo( $(col4.footer()).empty() )
        .on('change', function() {
          var val = $(this).val().map(function(muni){ // Converts municipalities to all towns within
            return mapReverseLookup(poststed, muni).map(val => val[0]).join('$|^');
          }).join('$|^');
          col4.search( val ? '^'+val+'$' : '', true, false ).draw();
        });
      
      appendFromDB(this.api()) // While we wait for the background refresh, append DB-data to our table
      dataUpdated(this.api()); // Data has been added to the table, this triggers more data-handling.
      datatableLoaded(); // Everything is now loaded, lets run this to add more functionality.
      backgroundRefresh(settings); // Fires a refresh of the table in the background, this is to load the rest of the table.
    }
  });
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
function datatableLoaded() {
  $('.chosen-select').chosen({width: "-webkit-fill-available"}); // Applies Chosen to the select-fields.

  if (window.location.hash) { // a hash is used to imply a filter on pageload, lets activate it
    filterStatus(window.location.hash.replace(/[#]/, ''));
  }

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
 * Runs when data in the datatables has been updated, either from a refresh or a pageload.
 * 
 * @param {DataTable} datatable datatable api
 */
function dataUpdated(dt) {
  filterRefresh(dt); // Refresh the table's filters.

  dt.rows().every(index=>{
    $(dt.row(index).node()).attr('title',dt.row(index).data()[7]) // Adds the short desc. as a title to the row
  })

  parseRowColors(dt) // Parses the info from the different row-colors and stores them more systematically.

  dt.draw(); // Render the table

  refreshDatabase(dt); // Refresh the database with the current datatable content.

  $('thead > tr, tfoot > tr').attr('style','') // Remove the color from table footer and header
  $('[data-rowcolor][data-rowcolor!=""]').each(function(){ // Finds cells with data-rowcolor
    $(this).parents('tr').addClass($(this).data('rowcolor')) // Colors the row
  })  
  $('#filter-unread > span').html(dt.rows('.rowcolor-orange').count()); // Counts the orange rows and display in menu-button
}

/**
 * Refreshes the database with the data in the current datatable
 * 
 * @param {DataTable} datatable 
 */
function refreshDatabase(datatable) {
  var db = new Database
  if (db.load()) { // is database present?
    db.update(datatable)
  } else {
    db.fromTable(datatable)
  }
  db.save()
}

/**
 * Appends database data to the supplied datatable
 * 
 * Works as a temporary cache before fresh data is loaded from server.
 * 
 * @param {DataTable} datatable 
 */
function appendFromDB(datatable) {
  var db = new Database().load()
  if (db) {
    db.update(datatable) // Refresh the data before we clear it below
    var dataarray = db.toTable()
    datatable.clear()
    datatable.rows.add(dataarray)
  }
}

/**
 * Extension's settings was updated, lets update the page etc.
 */
function settingsUpdated() {
  var dt = $('#bweb').DataTable()
  dt.state.clear()
  document.location.reload()
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
function tableLoading(tableid) {
  var head = $(tableid + ' thead');
  var row = $('<th colspan="11">').css({
    borderBottom:'0',
    letterSpacing:'20px',
    textAlign:'center'
  });
  for (var i=0;i<10;i++) {
    $('<span>&bull;</span>').appendTo(row);
  }

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
  var tblLoad = tableLoading('#bweb');
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
    tblLoad.remove();
  });

  var autorefresh = (typeof(settings.autorefresh) == 'undefined') ? true : settings.autorefresh
  if (autorefresh) {
    setTimeout(()=>backgroundRefresh(settings), 5*60*1000) // Refresh table after 5 mins
  }


}

/**
 * Updates the filter options based on table data.
 * 
 * @todo Use Datatable count() to update the numbers in nav.
 * 
 * @param {DataTable} datatable datatable api
 */
function filterRefresh(datatable) {
  datatable.columns([2,4,6,8,9,10,11,12,13]).every( function () {
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

  var col4 = datatable.column(5);
  var sel4 = $(col4.footer()).find('select').empty().append('<option value="">Alle</option>');
  var municipalities = [];

  col4.data().unique().sort().each( function (d, j) { // Build the array of municipalities based the towns in column 4
    if (typeof(poststed[d]) === 'undefined') { // Place doesn't exist, usually a typo
       poststed[d] = 'ukjente'; // put all unknowns into a fake municipality
    }
    if (municipalities.indexOf(poststed[d]) === -1) {
      municipalities.push(poststed[d]);
    }
  });
  var searchval = col4.search().replace(/[^\w\s/|ÆØÅæøå]/gi, '').split('|'); // Removes special chars in the search-string that is applied to column 4
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
      sel4.append( '<option value="'+muni+'" selected="selected">'+muni+'</option>' )
    } else {
      sel4.append( '<option value="'+muni+'">'+muni+'</option>' )
    }
  }

  sel4.trigger("chosen:updated");

}

function mapReverseLookup(objmap, search) {
  return Object.entries(objmap).filter(function (pair){
    return pair[1] == search;
  });
}

/**
 * Doc Ready!
 */
$(function(){
  chrome.storage.sync.get((settings) => { // Load the user's settings
    tableFix(); // Prepares the table
    uiBooster(settings); // Style and DOM mods
    initDatatable(settings); // Inits DataTable
  });
});