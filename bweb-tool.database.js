/**
 * The object Workorder.
 * 
 * @param {*} data
 */
function Workorder(data) {
  if (Array.isArray(data)) {
    this.id         = data[ 0]
    this.localRef   = data[ 1]
    this.orderDate  = data[ 2]
    this.customer   = data[ 3]
    this.location   = data[ 4]
    this.address    = data[ 5]
    this.shortdesc  = data[ 6]
    this.contractor = data[ 7]
    this.technician = data[ 8]
    this.product    = data[ 9]
    this.department = data[10]
    this.handler    = data[11]
    this.status     = data[12]
    this.rowcolor   = data[13]
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
  var data = datatable.data()
  var database = {}
  for (let i=0;i<data.length;i++) {
    let row = data[i]
    let id = $(row[0]).html()
    row[0] = id
    row[13] = $(datatable.row(i).node()).attr('style')
    database[id] = new Workorder(row)
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
  localStorage.setItem('bwebDB_v'+chrome.runtime.getManifest().version, JSON.stringify(toStorage))
}

function loadDatabase() {
  var data = JSON.parse(localStorage.getItem('bwebDB_v'+chrome.runtime.getManifest().version))
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
  localStorage.removeItem('bwebDB_v'+chrome.runtime.getManifest().version)
}