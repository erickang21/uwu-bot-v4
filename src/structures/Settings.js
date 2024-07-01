/**
 * Manages settings for a specific table.
 * Contains methods to update/get data and keeps a cache.
 * To make sure the cache is in sync only methods from here must be used.
 * To use: add a new settings instance for each table to manage in client.
 * this.settings = new Settings(this, "guilds");
 * And then use it's methods anywhere.
 * this.client.settings.update({ ... });
 */

 function mergeDefault(def, given) {
  if (!given) return def;
  for (const key in def) {
    if (!Object.hasOwn(given, key) || given[key] === undefined) {
      given[key] = def[key];
    } else if (given[key] === Object(given[key])) {
      given[key] = mergeDefault(def[key], given[key]);
    }
  }

  return given;
}

class Settings {
  constructor(client, collection, defaults = {}) {
    this.client = client;
    this.cache = new Map();
    this.collection = collection;
    this.defaults = defaults;
  }

  /**
   * Get a guild by ID from cache or the default settimgs.
   * @param {String} id - The ID to lookup the cache.
   * @returns {Object} The document from the cache if available.
   */
  get(id) {
    return this.cache.get(id) ?? this.defaults;
  }

  get db() {
    return this.client.db;
  }

  getDefaults(id) {
    return this.cache.get(id) || this.defaults;
  }

  /**
   * Updates settings for the table this settings instance manages.
   * The input is safe for upserts. If the document does not exist it inserts it.
   * @example
   * update(id, { levelup: false, social: true });
   * @param {String} id - The ID of the document to update.
   * @param {Object} obj - An object with key-value changes to apply.
   * @returns {Object} The updated object from the database.
   */
  async update(id, obj) {
    // Safety Check.
    if (typeof obj !== "object") {
      throw new Error("Expected an object.");
    }

    const { value } = await this.db.collection(this.collection).findOneAndUpdate({ _id: id }, { $set: obj }, {
      upsert: true,
      returnNewDocument: true,
      projection: { _id: 0 }
    });
    this.cache.set(id, mergeDefault(this.defaults, obj));
    return value;
  }

  /**
   * Syncs the cache with the database.
   * Use this incase the cache becomes outdated.
   * @param {String} id - ID of the document to sync.
   * @returns {Object} The newly fetched data from the database.
   */
  async sync(id) {
    const doc = await this.db.collection(this.collection).findOne({ _id: id }, {
      projection: { _id: 0 }
    });

    if (!doc) return;
    this.cache.set(id, mergeDefault(this.defaults, doc));
    return doc;
  }

  /**
   * Deletes a document with the given ID.
   * @param {String} id - ID of the document to delete.
   */
  async delete(id) {
    await this.db.collection(this.collection).deleteOne({ id });
    this.cache.delete(id);
  }

  /**
   * Alias to db.collection(col).find(...)
   */
  find(...args) {
    return this.db.collection(this.collection).find(...args);
  }

  /**
   * Alias to db.collection(col).findOne(...)
   */
  findOne(...args) {
    return this.db.collection(this.collection).findOne(...args);
  }

  /**
   * Initializes this settings by loading the cache.
   * Call this before the client is logged in.
   */
  async init() {
    const cursor = this.db.collection(this.collection).find().project({ _id: 0 });

    for await (const doc of cursor) {
      this.cache.set(doc.id, mergeDefault(this.defaults, doc));
    }
  }
}

module.exports = Settings;
