var AsyncCache = require('async-cache')
  , follow = require('follow')
  , request = require('request').defaults({ jar: false })
  , debug = require('debug')('couchcache')
  , inherits = require('util').inherits

module.exports = CouchCache

function CouchCache(opts) {
  if (!(this instanceof CouchCache)) return new CouchCache(opts)

  if (!opts || typeof opts !== 'object')
    throw new Error('options must be an object')

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

  AsyncCache.call(this, opts)


  this._changes = new follow.Feed(opts)

  this._changes.on('change', function (change) {
    debug('document changed', change.id)
    self.del(change.id)
  })

  this._changes.on('error', function (err) {
    self.emit('error', err)
  })

  this._changes.follow()
}

inherits(CouchCache, AsyncCache)

CouchCache.prototype.destroy = function () {
  this._changes.stop()
}


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
