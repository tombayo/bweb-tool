/**
 * Main Script of the extension
 */


/**
 * Applies various style and DOM improvements
 */
function uiBooster() {
  $('#content > h2').hide(); // Hides the standard heading
  $('#content > form').hide(); // Hides the horrible "filter" form
  $('#header span').first().hide(); // Removes the link "Hovedside", which is the same as the heading-link
  $('<div style="float:left"/>').append( // Creates a new Heading with link placed above navigation menu.
    $('<h2/>').css({marginBottom:'0px',marginTop:'1.5rem',display:'inline-block'}).append('<a href="/">Bestillingsweb</a>')
  ).insertAfter('#header > div:first');
  $('#header > div:last > b:last').hide().next().next().hide(); // removes back link
  $('#header > div:last > b:last')[0].nextSibling.remove(); // removes search field label
  $('#navigation > div:last > ul > li:first').remove(); // Removes the vanilla search button, replaced with another one below.
  $('#header form')
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
  $('#navigation > div:first').after(
    $('<div>').css({float:'left'}).append(
      $('<button id="filter-unread" type="button" title="Ordrer med uleste kommentarer.">Uleste (<span>0</span>)</button>')
        .addClass('nav-item'),
      $('<span>').addClass('nav-item'),
      $('<button id="refresh-btn" type="button">Oppdater</button>').addClass('nav-item').on('click',function(){
        if (!$(this).prop('disabled')) { // check if button is disabled, to prevent double loading
          backgroundRefresh();
        }
      }),
      $('<span id="refresh-feedback">').addClass('nav-item').css({overflow:'hidden'})
    )
  );

  $('.nav-item').height($('li > a').first().height()); // Makes sure the height of the items are the same

  /**
   * Below code changes the links to apply filters instead of loading new pages/tables.
   * Due to slow backend this is faster for both client and server.
   */ 
  $('#navigation > div:first a').each(function() {
    var filter = $(this).attr('href').replace(/[^\w\s]/gi, '');
    $(this).attr('href','#').on('click', function(){
      filterStatus(filter);
    });
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
  backgroundRefresh(); // Fires a refresh of the table in the background, this is to load the rest of the table.
  $('.chosen-select').chosen({width: "-webkit-fill-available"}); // Applies Chosen to the select-fields.

  // Moves the filter search field to the navbar
  $('#bweb_filter')
    .appendTo('#navigation')
    .css({float:'right',marginBottom:'0px'})
    .find('input')
      .addClass('nav-item')
      .height($('li > a').first().height())
      .attr('placeholder','Søk i tabell...')
      .attr('title', 'Søk i tabellen under.')
      .appendTo('#bweb_filter')
      .siblings('label').remove();
  $('#bweb_filter').append('<span class="nav-item">'); // Adds some space

  $('#filter-unread').on('click',function(){
    var $btn = $(this);
    var dt = $('#bweb').DataTable();
    if ($btn.is('.toggled')) {
      dt.rows(':not([style="background-color: #facb8e;"])').nodes().each(function(e){$(e).show()});
    } else {
      dt.rows(':not([style="background-color: #facb8e;"])').nodes().each(function(e){$(e).hide()});
    }
    $btn.toggleClass('toggled');
  });
}

/**
 * Runs when data in the datatables has been updated, either from a refresh or a pageload.
 * 
 * @param {DataTable} datatable datatable api
 */
function dataUpdated(datatable) {
  var dt = datatable;
  filterRefresh(dt); // Refresh the table's filters.
  $('#'+ dt.context[0].sTableId +' tbody > tr').each(function() { // Adds a hidden comment-field as a title to each row
    $(this).attr('title', $(this).html().match(/<!--[\s\S]*?-->/g)[0].replace(/<!--|-->|<td>|<\/td>/g, '').replace(/\n/g,' '));
  });
  $('#filter-unread > span').html(dt.rows('[style="background-color: #facb8e;"]').count());
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
  var row = $('<th colspan="10">').css({
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
function backgroundRefresh() {
  btnLoad('#refresh-btn', 'Oppdaterer');
  $('#refresh-feedback').html('').attr('title',''); // clears the feedback-area
  var tblLoad = tableLoading('#bweb');
  ajaxRefresh(function(data, status){
      var html = $($.parseHTML(data.toLowerCase())).find('#oversikt tbody');

      if (status !== 200) { // Something went wrong
        console.log(status);
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
        tbl.draw();
        dataUpdated(tbl); // Data is now updated, lets run this to trigger any additional work on the data.
        $('#refresh-feedback').html(new Date().toLocaleString() + ' - Oppdatert!').addClass('good-txt');
      }
      $('#refresh-feedback').attr('title',$('#refresh-feedback').html());
      btnReady('#refresh-btn', 'Oppdater &#8635;');
      tblLoad.remove();
    }
  );
}

/**
 * Loads our filter functions on a datatable
 * 
 * @todo Use Datatable count() to update the numbers in nav.
 * 
 * @param {DataTable} datatable datatable api
 */
function filterRefresh(datatable) {
  datatable.columns([1,3,4,5,7,8,9,10]).every( function () {
    var column = this;
    var select = $(column.footer()).find('select').empty().append('<option value="">Alle</option>'); // Clears the select to re-add based on new column data

    column.data().unique().sort().each( function ( d, j ) {
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

$(function(){

  /**
   * Some old code below, saved just in case it's needed sometime again:
  var num_orders = $('#id_antall').val();
  if (num_orders != 'Alle') { // Check if number of orders is set to ALL
    $('#id_antall option[value=Alle]').prop('selected', true); // Selects option ALL
    $('#content form').submit(); // Submits form to load full length table
    return undefined; // Breaks the function here, as the code below is not needed until after reload.
  }*/

  /**
   * Style and DOM mods
   */
  uiBooster();
  /**
   * Duplicate table to remove tablesorter, and adds a tfoot for the filter fields.
   * 
   * Ideally we'd just kill the tablesorter addon, but website runs an older version of 
   * tablesorter which does not support any such functionality. 
   */
  var newtable = $('<table id="bweb" width="100%" class="compact row-border hover">')
    .html($('#oversikt').html().toLowerCase());
  var footer = $('<tfoot/>')
    .html($(newtable).find('thead').html())
    .css('display','table-header-group')
    .appendTo(newtable);
  newtable.find('thead').css('display','table-row-group'); // Styles the head to drop below footer
  newtable.find('tfoot th').removeClass('header').html(''); // Clears the content of the cells copied from thead
  newtable.insertBefore('#oversikt');
  $('#oversikt').remove(); // Remove original table (has tablesorter active on it)

 

  /**
   * Sets up DataTable on our fresh table
   */
  $.fn.dataTable.moment('DD.MM.YYYY HH:mm'); // Prepare Moment.js for sorting datetime
  $('#bweb').DataTable({
    "stateSave": true, // Enables the state of the filters and sortings to be saved for the next session
    "language": {"url":"//cdn.datatables.net/plug-ins/1.10.16/i18n/Norwegian-Bokmal.json"}, // Adds l10n
    "order": [[ 0, "desc" ]], // Selects the initial ordering of the table
    "paging": false, // Defines if paging should be enabled
    "columnDefs": [ // Column number 6 is set to be invisible
      {
          "targets": [ 6 ],
          "visible": false
      }
    ],
    initComplete: function () {
      this.api().columns([1,3,4,5,7,8,9,10]).every( function () {
        var column = this;
        var select = $('<select data-placeholder="Filter.." class="chosen-select" multiple><option value="">Alle</option></select>')
          .appendTo( $(column.footer()).empty() )
          .on( 'change', function () {
            var val = $(this).val().join('|');
            column
              .search( val ? '^'+val+'$' : '', true, false )
              .draw();
          });
    
        column.data().unique().sort().each( function ( d, j ) {
          var searchval = column.search().replace(/[^\w\s/|ÆØÅæøå]/gi, '');
          if(searchval.indexOf(d) !== -1){
            select.append( '<option value="'+d+'" selected="selected">'+d+'</option>' )
          } else {
            select.append( '<option value="'+d+'">'+d+'</option>' )
          }
        });
      });
      datatableLoaded(); // Everything is now loaded, lets run this to add more functionality.
      dataUpdated(this.api()); // We have also added data in the table.
    }
  });
});