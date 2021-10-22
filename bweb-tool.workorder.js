/**
 * This file executes when a workorder-page is opened.
 */

/**
 * Modifies an address-text on the webpage to be a link to the map-service.
 */
function addAddressUrl() {
  var address = $('td:contains(Adresse)').first().next().html();
  var postnr = $('td:contains(Poststed)').first().next().html()?.split(' ')[0];
  var url = convertToKartserverUrl(address,postnr);
  if (url) {
    $('td:contains(Adresse)').first().next().html(
      $('<a>').attr({
        href: url,
        target: '_blank',
        title: 'Åpne Kartserver'
      }).html(address)
    )
  }
}

function addCustomerIdUrl() {
  var customerID = $('td:contains(Kundenummer)').first().next().html();
  $('td:contains(Kundenummer)').first().next().html(
    $('<a>').attr({
      href: 'https://mobileprov.altibox.net/mobile-app/customerSearch.action?customerId='+customerID,
      target: '_blank',
      title: 'Åpne MobileProv'
    }).html(customerID)
  )
}

function uiImprovements() {
  $('th').hide()
  $('input[type="submit"]:not(:first)').first().hide()
  $('table').first().css({maxWidth:'650px'})
}

function scrapeWorkorderTable() {
  let tbldata = Object.fromEntries([...document.querySelector('table').tBodies[0].rows].map(r => [...r.cells].map(c => c.innerText)).filter(r=>(r.length==2)))
  let tblmap = {
    id: tbldata['NTE referanse'].split('-',1)[0],
    tlf: tbldata['Telefon'].replace(/ /g, ''),
    email: tbldata['E-post'],
    customerid: tbldata['Kunde'].split(' ', 1)[0],
    description: tbldata['Notat:'],
    accepteddate: tbldata['Akseptert'],
    completiondate: tbldata['Ferdigmeldt'],
    productdesc: tbldata['Produkt:'],
    locationdesc: tbldata['Beskrivelse av lokasjon'],
    mapurl: tbldata['Kartserver:'],
    duedate: tbldata['Oppkoblingsfrist'],

    localref: tbldata['Ekstern referanse'],
    orderdate: tbldata['Registrert'],
    customer: tbldata['Kunde'].split(' ').slice(1).join(' '),
    location: tbldata['Poststed'].split(' ').slice(1).join(' '),
    address: tbldata['Adresse'],
    contractor: tbldata['Entreprenør:'],
    product: tbldata['Produkt:'].split(' ', 1)[0],
    handler: tbldata['Bestiller'].split(' ').slice(0,-1).join(' '),
    status: tbldata['Status']
  }

  return tblmap
}

var database = {}

Promise.all([new Database().load(),DOMReady()]).then((val)=>{
  database = val[0]
  addAddressUrl()
  addCustomerIdUrl()
  uiImprovements()

  let workorder = scrapeWorkorderTable()
  console.log('Scraped Workorder:',workorder)
  database.update(new Workorder(workorder)).save()
});