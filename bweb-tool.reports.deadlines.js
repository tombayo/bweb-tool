var database = new Database().load()

$(function(){
  //var tblarray =  [...document.querySelector('table').tBodies[0].rows].map(r => [...r.cells].map(c => c.innerText))

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