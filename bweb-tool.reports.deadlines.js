/**
 * Adds a column with addresses to the table.
 */

Promise.all([(new Database().load()),DOMReady()]).then((val)=>{
  //var tblarray =  [...document.querySelector('table').tBodies[0].rows].map(r => [...r.cells].map(c => c.innerText))
  var database = val[0]

  $('#oversikt > thead > tr').append('<th>Adresse</th>')

  $('#oversikt > tbody > tr').each(function(){
    var id = $(this).children(':first').text()
    if (typeof(database.data[id].address) !== 'undefined') {
      var newcell = database.data[id].address.replace(/^\w|\s\w/g, function (c) {
        return c.toUpperCase();
      })
    } else {
      var newcell = ''
    }
    

    $(this).append('<td>'+newcell+'</td>')

  })

})