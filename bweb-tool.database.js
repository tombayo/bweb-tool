/**
 * The class Workorder.
 */
class Workorder {
  /**
   * @static columnsOfTable The definition of the columns used in the DOM table
   */
  static columnsOfTable = [
    { name: 'rowcolor', ui: 'rowcolor', visible: false},
    { name: 'warning', ui: 'Varsel' },
    { name: 'url', ui: 'NTE ref', render: d=>{return `<a href="/endre/${d}">${d}</a>`}},
    { name: 'localref', ui: 'Ekstern ref' },
    { name: 'orderdate', ui: 'Reg. dato' },
    { name: 'customer', ui: 'Kunde' },
    { name: 'location', ui: 'Poststed' },
    { name: 'address', ui: 'Adresse' },
    { name: 'shortdesc', ui: 'Beskrivelse' },
    { name: 'contractor', ui: 'Entreprenør' },
    { name: 'technician', ui: 'Montør', applyFilter: true},
    { name: 'product', ui: 'Produkt', applyFilter: true},
    { name: 'department', ui: 'Kategori', applyFilter: true},
    { name: 'handler', ui: 'Bestilt av', applyFilter: true},
    { name: 'status', ui: 'Status', applyFilter: true}
  ].map(col=>Object.assign(col,{data:col.name})) // Duplicates the name prop to a new data prop
  /**
   * @static columnNames An array of all the column names
   */
  static columnNames = this.columnsOfTable.map(col=>col.name)
  /**
   * @static columnsToFilter An array of all the columns that we want to apply a filter tool to.
   */
  static columnsToFilter = this.columnsOfTable.filter(col => typeof(col.applyFilter) !== 'undefined').map(col=>col.name+':name')
  /**
   * Creates a new workorder with data from an array or object
   * 
   * Array data must match the structure of columns
   * 
   * @param {Array|Object} data object data or array
   * @param {Integer} id ID of array data
   */
  constructor(data,id) {
    if (Array.isArray(data)) {
      this.id         = id
      this.created    = new Date().toJSON()
      if (data.length === Workorder.columnsOfTable.length) {
        Object.assign(this, ...Workorder.columnNames.map((k,i) => ({[k]: data[i]})))
      } else {
        console.log('Couldn\'t create Workorder, invalid data/columns length', data, Workorder.columnsOfTable)
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
    delete data.created // Preserve object creation date
    delete data.columnsToFilter
    delete data.columnNames
    delete data.columnsOfTable

    Object.assign(this, data) // Merge this with new data, overwriting matching props

    this.updated = new Date().toJSON()
  }

  /**
   * Converts the data to an array.
   */
  toArray() {
    return this.columns.map((k) => this[k])
  }
}

/**
 * The Database class
 */
class Database {
  constructor(dbname  = 'bwebDB') {
    this.storageName  = `${dbname}_v${chrome.runtime.getManifest().version}`
    this.name         = dbname
    this.created      = new Date().toJSON()
    this.data         = {}

    return this
  }

  /**
   * Converts the database into table data that DataTable understands
   * 
   * Use DataTable.rows.add(dataarray).draw() to add and update the table.
   */
  toArray(workorder = false) {
    var dataarray = []
    var db = this.data

    for (let i in db) {
      dataarray.push((workorder)?db[i]:db[i].toArray())
    }
    return dataarray
  }

  /**
   * Takes an array of rows, each row containing an array of cols and updates the database.
   * Usualy data from table
   * 
   * @param {Array} dataarray
   */
  fromArray(dataarray) {
    for (let row of dataarray) {
      let id = row[2].replace(/<[^>]+>/g, ''); // Remove HTML tags to find the id
      this.update(new Workorder(row, id))
    }
    
    return this
  }

  /**
   * Updates the database with the supplied Workorder, Database, or DataTable array
   * 
   * @param {Workorder|Database|Array} data 
   */
  update(data) {
    try {
      if (data instanceof Workorder) { // Single entry
        if (typeof(this.data[data.id]) === 'undefined') {
          this.data[data.id] = data
        } else {
          this.data[data.id].update(data)
        }
      } else if (Array.isArray(data)) { // Array  
        this.update(new Database().fromArray(data))
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

    if (data != null) {
      Object.assign(this, data) // Overwrites with parsed obj from localstore
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