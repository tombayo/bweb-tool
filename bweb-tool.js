/**
 * Main Script of the extension
 */



$(function(){
  // Duplicate table to remove tablesorter, then remove original.
  var newtable = $('<table id="bweb">').html($('#oversikt').html()).insertBefore('#oversikt');
  $('#oversikt').remove();

  // Style fix
  $('#bweb .header').css({backgroundImage:'none',paddingLeft:'4px',cursor:'default'});

  $('#bweb').DataTable( {
    initComplete: function () {
      this.api().columns().every( function () {
        var column = this;
        var select = $('<select><option value=""></option></select>')
          .appendTo( $(column.footer()).empty() )
          .on( 'change', function () {
            var val = $.fn.dataTable.util.escapeRegex(
              $(this).val()
            );

            column
              .search( val ? '^'+val+'$' : '', true, false )
              .draw();
          });

        column.data().unique().sort().each( function ( d, j ) {
          select.append( '<option value="'+d+'">'+d+'</option>' )
        });
      });
    }
  });
});