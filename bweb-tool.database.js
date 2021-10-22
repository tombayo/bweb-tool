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
    { name: 'url', ui: 'NTE ref', render: (d,c,o)=>{return `<a href="/endre/${o.id}">${o.id}</a>`}},
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
   * @static columnsOfRawHTML An array that matches the columns of the Raw HTML table scraped off the website.
   */
  static columnsOfRawHTML = this.columnsOfTable.filter(col => typeof(col.extended) === 'undefined')
  static columnsOfRawHTMLnames = this.columnsOfRawHTML.map(col=>col.name)
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
    if (Array.isArray(data) && id) {
      this.id         = id
      this.created    = new Date().toJSON()
      if (data.length === Workorder.columnsOfRawHTML.length) {
        Object.assign(this, ...Workorder.columnsOfRawHTMLnames.map((k,i) => ({[k]: data[i]})))

        // Adds an archived date on Workorders that are already archived:
        this.archivedate = (this.status == 'arkivert')?this.created:undefined
      } else {
        console.log('Couldn\'t create Workorder, invalid data/columns length', data, Workorder.columnsOfTable)
      }
    } else {
      if (parseInt(data.id) !== NaN) {
        // fills missing columnNames with empty data to prevent bugs when Workorder is created outside of main table:
        Workorder.columnNames.map(v=>this[v] = ' ')
        Object.assign(this, data)

        this.created = data.created ?? new Date().toJSON() // Applies a created date if missing.

        // Adds a date of when the workorder was discovered to be archived:
        if ((this.status.toLowerCase() == 'arkivert') && (typeof(this.archivedate) == 'undefined')) {
          this.archivedate = this.updated ?? this.created
        }
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
    delete data.archivedate // Preserve archived date
    delete data.columnsToFilter
    delete data.columnNames
    delete data.columnsOfTable
    delete data.columnsOfRawHTML
    delete data.columnsOfRawHTMLnames

    /*
      Below code remove props that are empty, we dont need to overwrite those.
      If prop should stay empty, it would already be empty due to
      filling missing columnNames with empty data in constructor.
      @see this.constructor
    */
    for (let i in data) {
      if (data[i] === " ") delete data[i]
    }

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
class Database extends EventTarget {
  constructor(dbname  = 'bwebdb') {
    super()
    this.storagename  = `${dbname}_v${chrome.runtime.getManifest().version}`
    this.name         = dbname
    this.created      = new Date().toJSON()
    this.data         = {}
    this.updateEvent  = new CustomEvent('update')

    return this
  }

  /**
   * Converts the database into table data that DataTable understands
   * 
   * @argument archived Used to dump the archived data from DB.
   */
  toArray(archived = false) {
    var dataarray = []

    for (let i in this.data) {
      if ((typeof(this.data[i].archivedate) != 'undefined') == (archived)) {
        dataarray.push(this.data[i])
      }
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
        if (typeof(this.data[data.id]) === 'undefined') {// Do this database already have this id?
          this.data[data.id] = data
        } else {
          this.data[data.id].update(data)
        }
      } else if (Array.isArray(data)) { // Array  
        this.update(new Database().fromArray(data))
      } else if (data instanceof Database) { // Another Database 
        for (let i in data.data) {
          this.update(data.data[i]) // update Workorder entry with new data
        }
      } else {
        throw new Error('Wrong data fed to update(), unknown type')
      }
      
    } catch (error) {
      console.log('Error updating data: ', error.message, data)
    }

    return this
  }

  /**
   * Saves the database in chrome local storage
   */
  save() {
      this.updated = new Date().toJSON()

      chrome.storage.local.set({[this.name]: JSON.stringify(this).toLowerCase()}, (r)=>{
        this.dispatchEvent(this.updateEvent)
        console.log('DB saved..')
      })
  }

  /**
   * Loads the database from chrome local storage
   */
  load() {
    return new Promise((resolve,reject) => {
      chrome.storage.local.get(this.name, (response) => {
        var data = null

        if (typeof(response[this.name]) == 'string') {
          data = JSON.parse(response[this.name])
        } 

        if (data != null) {
          Object.assign(this, data) // Overwrites with parsed obj from localstore
          for (let i in this.data) { // Data in DB is in general object form, convert to Workorder
            this.data[i] = new Workorder(this.data[i]) 
          }
          console.log('DB loaded..')
        } else {
          console.log(`Couldn't parse JSON from storage.`)
        }

        resolve(this)
      })
    })
  }

  /**
   * Deletes the database from chrome storage
   */
  clear() {
    chrome.storage.local.clear()
    console.log('Storage cleared..')
  }

  /**
   * Archives old data from the database
   */
  clean() {
    var DBupdated = new Date(this.updated).getTime()
    var expiryTime = 24*60*60*1000 // 1 day

    for (let i in this.data) {
      if (typeof(this.data[i].archivedate) == 'undefined') { // check if already archived
        let woDate = this.data[i].updated ?? this.data[i].created
        let woTimestamp = new Date(woDate).getTime()
        if (woTimestamp+expiryTime < DBupdated) { // Workorder hasnt been updated in a while compared to DB
          console.log(i + ' is old, archiving...')
          this.data[i].archivedate = new Date().toJSON()
        }
      }
    }

    return this
  }
}