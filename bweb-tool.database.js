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
   * @param {Integer} id
   */
  constructor(data, id) {
    if (Array.isArray(data)) {
      this.id         = id
      this.created    = new Date().toJSON()
      if (data.length === 14) {
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
      } else {
        console.log('Couldn\'t create Workorder, invalid data length', data)
      }
    } else {
      if (parseInt(data.id) !== NaN) {
        Object.assign(this, data)
      } else {
        console.log('Couldn\'t create Workorder, invalid ID', data)
      }
    }
  }

  /**
   * Updates the data within this object
   * 
   * @param {Object} data 
   */
  update(data) {
    // Remove props we dont want to overwrite:
    delete data.id // No need to overwrite id
    delete data.url // Dont overwrite url as it contains frontend data
    delete data.created // Preserve object creation date

    Object.assign(this, data) // Merge this with new data, overwriting matching props

    this.updated = new Date().toJSON()
  }

  /**
   * Converts the data to an array.
   */
  toArray() {
    return [
      this.warning,
      this.url,
      this.localRef,
      this.orderDate,
      this.customer,
      this.location,
      this.address,
      this.shortdesc,
      this.contractor,
      this.technician,
      this.product,
      this.department,
      this.handler,
      this.status
    ]
  }
}

/**
 * The Database class
 */
class Database {
  constructor(dbname = 'bwebDB') {
    this.storageName = `${dbname}_v${chrome.runtime.getManifest().version}_${window.location.pathname.replace(/[/]/gi,'')}`
    this.name        = dbname
    this.created     = new Date().toJSON()
    this.data        = {}

     return this
  }
  /**
   * Converts the database into table data that DataTable understands
   * 
   * Use DataTable.rows.add(dataarray).draw() to add and update the table.
   */
  toTable() {
    var dataarray = []
    var db = this.data

    for (let i in db) {
      dataarray.push(db[i].toArray())
    }
    return dataarray
  }

  /**
   * Takes a DataTable and updates the database with the data
   * 
   * @param {DataTable} datatable 
   */
  fromTable(datatable) {
    var dataarray = datatable.data().toArray()
    for (let row of dataarray) {
      let id = row[1].replace(/<[^>]+>/g, ''); // Remove HTML tags to find the id
      this.update(new Workorder(row, id))
    }
    
    return this
  }

  /**
   * Updates the database with the supplied Workorder, Database, or DataTable array
   * 
   * @param {Workorder|Database|DataTable} data 
   */
  update(data) {
    try {
      if (data instanceof Workorder) { // Single entry
        if (typeof(this.data[data.id]) === 'undefined') {
          this.data[data.id] = data
        } else {
          this.data[data.id].update(data)
        }
      } else if (typeof(data.$) === 'function') { // DataTable  
        this.update(new Database().fromTable(data))
      } else if (data instanceof Database) { // Another Database 
        for (let i in data.data) {
          let row = data.data[i]

          if (typeof(row.id) === 'undefined') throw new Error('Wrong data fed to update(), missing property "id" in row')

          if (typeof(this.data[row.id]) === 'undefined') { // Do this database already have this id?
            this.update(new Workorder(row, row.id))
          } else {            
            this.update(row) // update Workorder entry with new data
          }

        }
      } else {
        throw new Error('Wrong data fed to update(), unknown type')
      }

      if (typeof(this.overwrites) !== 'undefined') {
        this.update(this.overwrites) // Overwrites the newly refreshed data with custom data
      }

      this.updated = new Date().toJSON()

    } catch (error) {
      console.log('Error updating data: ', error.message, data)
    }

    return this
  }

  /**
   * Saves the database in localStorage
   */
  save() {
    localStorage.setItem(this.storageName, JSON.stringify(this))

    return this
  }

  /**
   * Loads the database from localStorage
   */
  load() {
    var data = JSON.parse(localStorage.getItem(this.storageName))

    if (data == null) {
      return false
    } else {
      Object.assign(this, data)
      for (let i in this.data) { // Data in DB is in general object form, convert to Workorder
        this.data[i] = new Workorder(this.data[i]) 
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