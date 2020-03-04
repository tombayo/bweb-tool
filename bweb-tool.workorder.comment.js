/**
 * This file executes when the comment section on a workorder-page is opened.
 */


/**
 * Adds the current logged in company name to a div with the id entrep.
 * This is to re-enable some broken funtionality on the vanilla page.
 */
function addentrepID() {
  var entrep = $('#header > div:last-child').html().match(/\(([^\)]+)\)/)[1]
  $('<div id="entrep">'+entrep+'</div>').appendTo('body').hide();
}

/**
 * Gets the contact's phonenumber of the current workorder.
 */
function getTlf() {
  return $('td:contains(Telefon kontaktperson)').next().html()
}


$(function(){
  applyDarkmode()
  addentrepID()
  $("input[name='sms']").click(()=> {
    $("#id_telefon").val(getTlf())
  })
})