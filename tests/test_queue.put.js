var ironmq  = require('../').IronMQ;

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var token   = con.token
var project = con.projectId
var q_name  = con.queue

if (con.proxy) {
  var req = nock('https://mq-aws-us-east-1.iron.io')
    .matchHeader('authorization','OAuth ' + token)
    .matchHeader('content-type','application/json')
    .matchHeader('user-agent','IronMQ Node Client')
    .post(
      '/1/projects/' + project + '/queues/' + q_name + '/messages'
      , {"messages" : [{body:"this is a test"}]})
    .reply(200
      , { ids: ['4f176348ef05202f74005bc6']
        , msg: 'Messages put on queue.' })
}


test('queue.put(str, {}, func)', function(t) {

  var client = ironmq(token)
  var queue  = client
                .projects(project)
                .queues(q_name)

  queue.put('this is a test', {}, function(err, obj) {
    t.deepEqual(obj,
                    { ids: ['4f176348ef05202f74005bc6']
                    , msg: 'Messages put on queue.'})
    t.end()
  })

})


//TODO
// msg, not object, cb -> throw error

