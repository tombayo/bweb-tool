/**
 * Library file with common functions
 */


/**
 * Function to check if DOM is loaded
 * 
 * @returns Promise Resolves when the DOM is ready
 */
async function DOMReady() {
  return new Promise((resolve,reject)=>{
    if (document.readyState === 'complete') {
      resolve(document)
    } else {
      document.addEventListener('DOMContentLoaded',()=>resolve(document))
    }
  })
}

/**
 * Function to load the user settings from Chrome's Synced storage
 * 
 * @returns Promise Resolves to the user settings
 */
function loadSettings() {
  return new Promise((resolve,reject) => {
    chrome.storage.sync.get((response) => {
      resolve(response)
    })
  })
}

/**
 * 
 */
function mapReverseLookup(objmap, search) {
  return Object.entries(objmap).filter(function (pair){
    return pair[1] == search;
  });
}

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