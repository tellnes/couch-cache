# Couch Cache

A cache solution for CouchDB documents.

CouchCache uses the `_changes` feed in CouchDB to invalidate documents.

## Usage

```js
var CouchCache = require('couchcache')

var cache = new CouchCache({ db: 'http://localhost:5984/database'
                           , filter: 'design_doc/filter_name'
                           , max: 1000
                           })

cache.get('document_id', function (err, doc) {
  console.log(doc)
})
```

## Install

    $ npm install couchcache

## Options

The `db` option is required.
All options in [follow](https://npmjs.org/package/follow) and [lru-cache](https://npmjs.org/package/lru-cache) is available except for the `since` option in `follow`.

## API

`CouchCache` inherits from [AsyncCache](https://npmjs.org/package/async-cache).

- `CouchCache#destroy`
   Stops the changes watcher.

## Licence

MIT
