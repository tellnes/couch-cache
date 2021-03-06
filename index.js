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
    , prefix = opts.prefix || ''

  this.db = opts.db || opts.url || opts.uri

  opts.since = 'now'

  opts.load = function (id, cb) {
    debug('document not in cache', id)

    request.get({ uri: self.db + '/' + prefix + id
                , json: true
                }
    , function (err, res, body) {
        if (!err && res.statusCode != 200) {
          if (res.statusCode === 404) return cb(null, null)
          if (res.statusCode >= 400) err = new CouchError(id, res, body)
          else err = new Error('Unexpected status code from CouchDB; ' + res.statusCode)
        }

        if (err) return cb(err)

        cb(null, body)
      }
    )
  }


  this._changes = new follow.Feed(opts)

  var origEmit = this._changes.emit
  this._changes.emit = function (type) {
    if (type !== 'error')
      origEmit.apply(this, arguments)
    if (type !== 'newListener' && type !== 'removeListener')
      self.emit.apply(self, arguments)
  }

  self._confirmed = false
  self._changes.once('confirm', function () {
    self._confirmed = true
  })

  this._changes.on('change', function (change) {
    debug('document changed', change.id)
    self._cache.del(change.id.slice(prefix.length))
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
    return this._cache[name].apply(this._cache, arguments)
  }
})


CouchCache.prototype.load = function (view, cb) {
  var self = this

  if (!self._confirmed) {
    self._changes.once('confirm', function () {
      self.load(view, cb)
    })
    return
  }

  if (typeof view === 'function') {
    cb = view
    view = ''
  }

  if (!view) view = '_all_docs'

  if (!cb) cb = function (err) {
    if (err) return self.emit('error', err)
  }

  request.get(
      { uri: this.db + '/' + view + '?include_docs=true'
      , json: true
      }
    , function (err, res, body) {
        if (!err) {
          if (body.error) {
            err = new Error('CouchError: ' + body.error + '; ' + body.reason)
          } else if (res.statusCode != 200) {
            err = new Error('Unexpected status code from CouchDB; ' + res.statusCode)
          }
        }
        if (err) return cb(err)

        for (var i = 0; i < body.rows.length; i++) {
          self.set(body.rows[i].id, body.rows[i].doc)
        }

        cb(null)
      }
    )
}

function CouchError(id, res, body) {
  Error.captureStackTrace(this, CouchError)
  Error.call(this)
  this.name = 'CouchError'
  this.id = id
  this.statusCode = res.statusCode
  this.code = body.error
  this.message = body.reason
}
inherits(CouchError, Error)
module.exports.CouchError = CouchError

CouchError.prototype.toString = function () {
  return this.name + ': Got ' + this.statusCode + ' ' + this.message + ' - asking for ' + this.id
}
