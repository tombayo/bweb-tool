/**
 * The object Workorder.
 * 
 * @param {*} data
 */
function Workorder(data) {
  if (Array.isArray(data)) {
    this.warning    = data[ 0]
    this.id         = data[ 1]
    this.localRef   = data[ 2]
    this.orderDate  = data[ 3]
    this.customer   = data[ 4]
    this.location   = data[ 5]
    this.address    = data[ 6]
    this.shortdesc  = data[ 7]
    this.contractor = data[ 8]
    this.technician = data[ 9]
    this.product    = data[10]
    this.department = data[11]
    this.handler    = data[12]
    this.status     = data[13]
    this.rowcolor   = data[14]
  } else {
    Object.assign(this, data)
  }
} 

/**
 * Takes the table data and turns it into a database
 * 
 * @param {DataTable} datatable
 */
function tableToDatabase(datatable) {
  var data = $.extend(true,[],datatable.data().toArray())
  var database = {}
  for (let i=0;i<data.length;i++) {
    let row = data[i]
    row[0] = row[0].replace(/<[^>]+>/g, '');
    row[14] = $(datatable.row(i).node()).attr('style')
    database[row[0]] = new Workorder(row)
  }
  return database
}

/**
 * Takes the database data and turns it into table data that DataTable understands.
 * 
 * Use table.rows.add(dataarray).draw() to add and update the table.
 * 
 * @param {Array} db The database as generated in tableToDatabase
 */
function databaseToTable(db) {
  var dataarray = []
  for (row in db) {
    var rowcolor = (typeof(db[row].rowcolor) == 'undefined')?'':db[row].rowcolor
    dataarray.push([
      '<a data-rowcolor="'+rowcolor+'" href="/endre/'+db[row].id+'">'+db[row].id+'</a>',
      db[row].localRef,
      db[row].orderDate,
      db[row].customer,
      db[row].location,
      db[row].address,
      db[row].shortdesc,
      db[row].contractor,
      db[row].technician,
      db[row].product,
      db[row].department,
      db[row].handler,
      db[row].status
    ])
  }
  return dataarray
}

function updateDatabase(database, newdata) {
  if (newdata instanceof Workorder) { // Single entry
    if (typeof(database[newdata.id]) === 'undefined') {
      database[newdata.id] = newdata
    } else {
      database[newdata.id] = {...database[newdata.id], ...newdata}
    }
  } else { // assume array/obj to iterate over
    for (row in newdata) {
      if (typeof(database[newdata[row].id]) === 'undefined') {
        database[newdata[row].id] = newdata[row]
      } else {
        database[newdata[row].id] = new Workorder({...database[newdata[row].id], ...newdata[row]}) // merge new data into old entry
      }
    }
  }
  return database
}

function saveDatabase(database) {
  var toStorage = []
  for (row in database) {
    toStorage.push({...database[row]})
  }
  localStorage.setItem('bwebDB_v'+chrome.runtime.getManifest().version+'_'+window.location.pathname.replace(/[/]/gi, ''), JSON.stringify(toStorage))
}

function loadDatabase() {
  var data = JSON.parse(localStorage.getItem('bwebDB_v'+chrome.runtime.getManifest().version+'_'+window.location.pathname.replace(/[/]/gi, '')))
  var database = {}

  if (data == null) {
    return false
  } else {
    for (row of data) {
      database[row.id] = new Workorder(row)
    }
    return database
  }
}

function clearDatabase() {
  localStorage.removeItem('bwebDB_v'+chrome.runtime.getManifest().version+'_'+window.location.pathname.replace(/[/]/gi, ''))
}