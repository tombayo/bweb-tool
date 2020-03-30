/**
 * This file executes when a workorder-page is opened.
 */


/**
 * Parse a string as a norwegian address.
 * 
 * Returns false if the string isn't a valid address.
 * Returns an array of length 2 or 3 if a valid address is found.
 * The array contains street name, resident number, resident letter respectively.
 * Resident letter is omitted if it doesn't exist in the string.
 * 
 * Ex:
 * Halsenvegen 14   --> ["Halsenvegen", "14"]
 * Storgata 4 B     --> ["Storgata", "4", "B"]
 * Kongsvegen 123a  --> ["Kongsvegen", "123", "a"]
 * 
 * @param {String} str
 * @returns {Array}
 */
function parseNorAddress(str) {
  var e = str.split(' ');
  var ret = false;

  if (e.length === 1) { // not a valid address
    ret = false;
  } else if (e.length >= 2) {
    if (isNaN(e[e.length-1])) { // is the last element Not-a-number?
      if (e[e.length-1].length > 1) {
        if (e[e.length-1].search(/[A-z]/) < e[e.length-1].length-1) { // checks if the last character is a letter
          ret = false;
        } else {
          ret = [e.slice(0, e.length-1).join(' '), e[e.length-1].slice(0,e[e.length-1].length-1), e[e.length-1].substr(-1)];
        }
      } else { // last element is of length 1
        if (e.length === 2) {
          ret = false;
        } else {
          if (isNaN(e[e.length-2])) { // is the next to last element not-a-number?
            ret = false;
          } else {
            ret = [e.slice(0, e.length-2).join(' '), e[e.length-2], e[e.length-1]];
          }
        }
      }
    } else {
      ret = [e.slice(0, e.length-1).join(' '), e[e.length-1]];
    }
  } else {
    ret = false;
  }

  if (ret) {
    if (ret[0].search(/[1-9]/) !== -1) { // checks if first chunk of address contains a number
      ret = false;
    }
  }

  return ret;
}

/**
 * Creates a URL to the map service Kartserver.no based on supplied postnumber and address-string
 * 
 * @param {String} str 
 * @param {String} postnr 
 * 
 * @returns {String}
 */
function convertToKartserverUrl(str, postnr) {
  var url = "https://www.kartserver.no/?Address="+postnr;
  var address = parseNorAddress(str);
  if (address) {
    return url+"|||"+address.join('|||')+"|||";
  } else {
    return false;
  }
}

/**
 * Modifies an address-text on the webpage to be a link to the map-service.
 */
function addAddressUrl() {
  var address = $('td:contains(Adresse)').first().next().html();
  var postnr = $('td:contains(Poststed)').first().next().html().split(' ')[0];
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

    localref: tbldata['Ekstern referanse'],
    orderdate: tbldata['Registrert'],
    customer: tbldata['Kunde'].split(' ').slice(1).join(' '),
    location: tbldata['Poststed'].split(' ').slice(1).join(' '),
    address: tbldata['Adresse'],
    contractor: tbldata['Entreprenør:'],
    technician: document.forms[1].montoer.value,
    product: tbldata['Produkt:'].split(' ', 1)[0],
    handler: tbldata['Bestiller'].split(' ').slice(0,-1).join(' '),
    status: tbldata['Status']
  }

  return tblmap
}

$(function(){
  addAddressUrl();
  addCustomerIdUrl();
  uiImprovements();

  let workorder = scrapeWorkorderTable()
  if (workorder.status !== 'Arkivert') {
    console.log('Scraped Workorder:',workorder)
    let db = new Database().load().update(new Workorder(workorder)).save()
  }
});