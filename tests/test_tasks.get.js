var ironWorker  = require('../').IronWorker;

var nock    = require('nock');
var test    = require('tap').test;
var con     = require('./constants.js');

var token   	= con.token;
var projectId 	= con.projectId;
var taskId    	= con.taskId;

test('queues', function(t)
{
  //TODO error when !project or typeof project !== 'string'
  var client  = ironWorker(token);
  var project = client.projects(projectId);
  var task  = project(taskId);

  t.ok(task);
  t.ok(typeof task.info  === 'function');
  t.ok(typeof task.log  === 'function');
  t.ok(typeof task.cancel  === 'function');
  t.ok(typeof task.progress === 'function');
  t.ok(typeof task.id === 'function');

  t.end();
});

if (con.proxy)
{
  var req = nock(con.ironWorkerRootUrl)
    .matchHeader('authorization','OAuth ' + token)
    .matchHeader('content-type','application/json')
    .matchHeader('user-agent',con.ironWorkerUserAgent)
    .get(
      '/1/projects/' + projectId + '/tasks?page=0&per_page=0')
    .reply(200
        ,[{ Timestamper   : {updated_at: 1327083607064000000 }
          , project_id    : projectId
          , id            : taskId}]);
}

test('tasks.list', function(t) {

  ironWorker(token)(projectId).list(function(err, obj) {

    t.equal(obj.length, 1);
    t.equal(obj[0].id(), taskId);
    t.ok(typeof obj[0].info  === 'function');
    t.ok(typeof obj[0].log  === 'function');
    t.ok(typeof obj[0].cancel  === 'function');
    t.ok(typeof obj[0].progress === 'function');
	t.ok(typeof obj[0].id === 'function');

    // t.deepEqual(obj[0].Timestamper,{updated_at: 1327083607064000000});

    t.end();
  });
});

//TODO
// []
// {}
// cb
