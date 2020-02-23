/**
 * The class Workorder.
 */
class Workorder {
  /**
   * Creates a new workorder with data from an array or object
   * 
   * Array data must match the structure of the #bweb-table
   * 
   * @param {Array|Object} data 
   */
  constructor(data, id) {
    if (Array.isArray(data)) {
      this.id         = id
      this.warning    = data[0]
      this.url        = data[1]
      this.localRef   = data[2]
      this.orderDate  = data[3]
      this.customer   = data[4]
      this.location   = data[5]
      this.address    = data[6]
      this.shortdesc  = data[7]
      this.contractor = data[8]
      this.technician = data[9]
      this.product    = data[10]
      this.department = data[11]
      this.handler    = data[12]
      this.status     = data[13]
      this.rowcolor   = data[14]
    }
    else {
      Object.assign(this, data)
    }
  }
}

/**
 * The Database class
 */
class Database {
  storageName = 'bwebDB_v'+chrome.runtime.getManifest().version+'_'+window.location.pathname.replace(/[/]/gi, '')
  constructor() { return this }
  /**
   * Converts the database into table data that DataTable understands
   * 
   * Use table.rows.add(dataarray).draw() to add and update the table.
   */
  toTable() {
    var dataarray = []
    var db = this.data

    for (let i in db) {
      var rowcolor = (typeof(db[i].rowcolor) == 'undefined')?'':db[i].rowcolor
      dataarray.push([
        db[i].warning,
        `<a data-rowcolor="${rowcolor}" href="/endre/${db[i].id}">${db[i].id}</a>`,
        db[i].localRef,
        db[i].orderDate,
        db[i].customer,
        db[i].location,
        db[i].address,
        db[i].shortdesc,
        db[i].contractor,
        db[i].technician,
        db[i].product,
        db[i].department,
        db[i].handler,
        db[i].status
      ])
    }
    return dataarray
  }

  /**
   * Takes a DataTable and create a database
   * 
   * Will overwrite existing data
   * 
   * @param {DataTable} datatable 
   */
  fromTable(datatable) {
    var dataarray = datatable.data().toArray()
    this.data = {}
    for (let row of dataarray) {
      let id = row[1].replace(/<[^>]+>/g, '');
      this.data[id] = new Workorder(row, id)
    }
    
    return this
  }

  /**
   * Updates the database with the supplied Workorder, Array of workorders, or DataTable array
   * 
   * @param {Workorder|Array|DataTable} data 
   */
  update(data) {
    if (data instanceof Workorder) { // Single entry
      if (typeof(this.data[data.id]) === 'undefined') {
        this.data[data.id] = data
      } else {
        this.data[data.id] = {...this.data[data.id], ...data}
      }
    } else { 
      if (typeof(data.$) === 'function') { // DataTable 
        var db = new Database
        this.update(db.fromTable(data).data)
      } else { // Array of Workorders
        for (let i in data) {
          let row = data[i]
          if (typeof(this.data[row.id]) === 'undefined') {
            this.data[row.id] = row
          } else {
            this.data[row.id] = new Workorder({...this.data[row.id], ...row}) // merge new data into old entry
          }
        }
      }
      
    }

    return this
  }

  /**
   * Saves the database in localStorage
   */
  save() {
    localStorage.setItem(this.storageName, JSON.stringify(this.data))

    return this
  }

  /**
   * Loads the database from localStorage
   */
  load() {
    var data = JSON.parse(localStorage.getItem(this.storageName))
    this.data = {}

    if (data == null) {
      return false
    } else {
      for (let i in data) {
        let row = data[i]
        this.data[row.id] = new Workorder(row)
      }
    }

    return this
  }

  /**
   * Deletes the database from localStorage
   */
  clear() {
    localStorage.removeItem(this.storageName)
  }
}