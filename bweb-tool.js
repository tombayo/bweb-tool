/**
 * Main Script of the extension
 */



$(function(){
  // Duplicate table to remove tablesorter, and add tfoot for filtering
  var newtable = $('<table id="bweb" width="100%" class="compact row-border">')
    .html($('#oversikt').html());
  var footer = $('<tfoot/>')
    .html($(newtable).find('thead').html())
    .css('display','table-header-group')
    .appendTo(newtable);
  newtable.find('thead').css('display','table-row-group'); // Styles the head to drop below footer
  newtable.find('tfoot th').removeClass('header').html(''); // Clears the content of the cells copied from thead

  newtable.insertBefore('#oversikt');

  $('#oversikt').remove(); // Remove original table (has tablesorter active on it)

  // Style fix
  //$('#bweb .header').css({paddingLeft:'4px',cursor:'default'});

  $('#bweb').DataTable( {
    "order": [[ 0, "desc" ]], // Selects the initial ordering of the table
    "paging": false, // Defines if paging should be enabled
    "columnDefs": [ // Column number 6 is set to be invisible
      {
          "targets": [ 6 ],
          "visible": false
      }
    ],
    initComplete: function () {
      this.api().columns([3,4,5,7,8,9,10]).every( function () {
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
          select.append( '<option value="'+d+'">'+d+'</option>' )
        });
        $('.chosen-select').chosen({width: "-webkit-fill-available"});
      });
    }
  });
});