var CouchCache = require('./')

var cc = new CouchCache({ db: 'http://localhost:5984/database'
                        , filter: 'design_doc/filter_name'
                        })

cc.get('document_id', function (err, doc) {
  if (err) throw err
  console.log(doc)
})
