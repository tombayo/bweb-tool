/**
 * Main Script of the extension
 */


/**
 * Applies various style and DOM improvements
 */
function uiBooster() {
  $('#content > h2').hide();
  $('#content > form').hide();
  $('#header span').first().hide();
  $('<div style="float:left"/>').append(
    $('<h2/>').css({marginBottom:'0px',marginTop:'1.5rem'}).append('<a href="/">Bestillingsweb</a>')
  ).insertAfter('#header > div:first');
  $('#header > div:last > b:last').hide().next().hide().next().hide();
  $('#header > div:last > b:last')[0].nextSibling.remove();
  $('#content > span.secret').hide();

  // Below code changes the links to apply filters instead of loading new pages/tables (this is faster for both client and server)
  $('#navigation > div:first a').each(function() {
    var filter = $(this).attr('href').replace(/[^\w\s]/gi, '');
    $(this).attr('href','#').on('click', function(){
      filterStatus(filter);
    });
  });
}

/**
 * Runs when DataTable is fully loaded, hence used to do stuff with DataTable
 */
function datatableLoaded() {
  $('.chosen-select').chosen({width: "-webkit-fill-available"}); // Applies Chosen to the select-fields.
}

/**
 * Applies a filter to the status column
 * 
 * @param {*String} status 
 */
function filterStatus(status) {
  $('.chosen-select:last').val([status]).trigger('change').trigger('chosen:updated'); // Run the filter-change.
}

function asyncRefresh() {
  $.post('https://bweb2.nteb.no/',{
    csrfmiddlewaretoken: $('[name="csrfmiddlewaretoken"]').val(),
    kategori: '',
    antall: 'Alle',
  },
  function(data,status){
    var html = $.parseHTML(data);
    var div = $('<div>').html(html);
    var tbl = $('#bweb').DataTable();
    tbl.clear();
    
  });
}

$(function(){
  var num_orders = $('#id_antall').val();
  if (num_orders != 'Alle') { // Check if number of orders is set to ALL
    $('#id_antall option[value=Alle]').prop('selected', true); // Selects option ALL
    $('#content form').submit(); // Submits form to load full length table
    return undefined; // Breaks the function here, as the code below is not needed until after reload.
  }

  // Duplicate table to remove tablesorter, and add tfoot for filtering
  var newtable = $('<table id="bweb" width="100%" class="compact row-border">')
    .html($('#oversikt').html().toLowerCase());
  var footer = $('<tfoot/>')
    .html($(newtable).find('thead').html())
    .css('display','table-header-group')
    .appendTo(newtable);
  newtable.find('thead').css('display','table-row-group'); // Styles the head to drop below footer
  newtable.find('tfoot th').removeClass('header').html(''); // Clears the content of the cells copied from thead

  newtable.insertBefore('#oversikt');

  $('#oversikt').remove(); // Remove original table (has tablesorter active on it)

  // Style and DOM mods
  uiBooster();


  $.fn.dataTable.moment('DD.MM.YYYY HH:mm'); // Prepare Moment.js for sorting datetime
  $('#bweb').DataTable( {
    "stateSave": true,
    "language": {"url":"//cdn.datatables.net/plug-ins/1.10.16/i18n/Norwegian-Bokmal.json"},
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

        datatableLoaded(); // Everything is now loaded, lets run this to add more functionality.
      });
    }
  });
});