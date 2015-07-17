# Couch Cache

A cache solution for CouchDB documents.

CouchCache uses the `_changes` feed in CouchDB to invalidate documents.

## Usage

```js
var CouchCache = require('couch-cache')

var cache = new CouchCache({ db: 'http://localhost:5984/database'
                           , max: 1000
                           })

cache.get('document_id', function (err, doc) {
  console.log(doc)
})
```

## Install

    $ npm install couch-cache

## Options

The `db` option is required.
All options in [follow](https://npmjs.org/package/follow) and
[lru-cache](https://npmjs.org/package/lru-cache) is available except for the
`since` option in `follow`.

- `prefix`
  A string to prefix the CouchDB ids with.

## API

`CouchCache` inherits from `EventEmitter`. All the method on
[AsyncCache](https://npmjs.org/package/async-cache) is proxied.

- `CouchCache#destroy`
   Stops the changes watcher.

## Licence

MIT
