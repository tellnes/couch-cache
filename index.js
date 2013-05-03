var AsyncCache = require('async-cache')
  , follow = require('follow')
  , request = require('request').defaults({ jar: false })
  , debug = require('debug')('couch-cache')
  , inherits = require('util').inherits
  , EventEmitter = require('events').EventEmitter

module.exports = CouchCache

function CouchCache(opts) {
  if (!(this instanceof CouchCache)) return new CouchCache(opts)

  if (!opts || typeof opts !== 'object')
    throw new Error('options must be an object')

  EventEmitter.call(this)

  var self = this
    , db = opts.db || opts.url || opts.uri

  opts.since = 'now'

  opts.load = function (id, cb) {
    debug('document not in cache', id)

    request.get({ uri: db + '/' + id
                , json: true
                }
    , function (err, res, body) {
        if (!err && res.statusCode != 200) {
          if (res.statusCode >= 400) err = new CouchError(res, body)
          else err = new Error('Unexpected status code from CouchDB; ' + res.statusCode)
        }

        if (err) return cb(err)

        cb(null, body)
      }
    )
  }


  this._changes = new follow.Feed(opts)

  this._changes.on('change', function (change) {
    debug('document changed', change.id)
    self._cache.del(change.id)
  })

  this._changes.on('error', function (err) {
    self.emit('error', err)
  })

  this._changes.follow()


  this._cache = new AsyncCache(opts)
}

inherits(CouchCache, EventEmitter)

CouchCache.prototype.destroy = function () {
  this._changes.stop()
}


Object.getOwnPropertyNames(AsyncCache.prototype).forEach(function (name) {
  CouchCache.prototype[name] = function () {
    this._cache[name].apply(this._cache, arguments)
  }
})


function CouchError(res, body) {
  Error.captureStackTrace(this, CouchError)
  Error.call(this)
  this.name = 'CouchError'
  this.statusCode = res.statusCode
  this.code = body.error
  this.message = body.reason
}
inherits(CouchError, Error)
module.exports.CouchError = CouchError
