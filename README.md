IronWorker Node Client
-------------

Getting Started
==============

Install:

    npm installation not supported yet

You can get your `token` and `project_id` at http://www.iron.io .

The reference IronWorker's REST/HTTP API is here:
http://dev.iron.io/worker/reference/api/

The Basics
=========

**List** your account's projects:

  	var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.listProjects(function callBack(err, projects) {
			projects.forEach(function (project)
            {
            	console.log(project.id());
        	}	
        });
        
  Note: the projects returned in the callback are project objects, on which you can make project API calls

**List** tasks in a project:

	var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.listTasks(function callBack(err, tasks) {
			tasks.forEach(function (task)
        	{
            	console.log(task.id());
        	}	
        });
        
  Note: the tasks returned in the callback are task objects, on which you can make task API calls

**Queue** a task:

	var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.queueTask('code_name', 'payload', priority, timeout, delay, function (err,obj) 
  		{
  			assertTrue(obj.msg == "Queued up");
  		});
  		
**Queue** a task using the webhook:

	var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.hookTask('code_name', 'payload', function (err,obj) 
  		{
  			assertTrue(obj.msg == "Queued up");
  		});

**Get** info about a task:

    var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.tasks('task_id')
  		.info(function (err,obj) 
  		{
  			console.log(obj.id);
			console.log(obj.project_id);
			console.log(obj.code_id);
			console.log(obj.code_history_id);
			console.log(obj.status);
			console.log(obj.code_name);
			console.log(obj.code_rev);
			console.log(obj.start_time);
			console.log(obj.end_time);
			console.log(obj.duration);
			console.log(obj.timeout);
  		});

**Get** a task's log:

    var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.tasks('task_id')
  		.log(function (err,obj) 
  		{
  			console.log(obj); // Content-Type is “text/plain”
  		});
    
**Cancel** a task:

    var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.tasks('task_id')
  		.cancel(function (err,obj) 
  		{
  			assertTrue(obj.msg == "Cancelled");
  		});
  		
**Set Progress** on a task:

    var ironWorker = require('ironmq').IronWorker;
  	ironWorker('token')
  		.projects('project_id')
  		.tasks('task_id')
  		.progress(percent,'msg',function (err,obj) 
  		{
  			assertTrue(obj.msg == "Progress Set");
  		});
    

IronMQ Node Client
-------------

Getting Started
==============

Install:

    npm install ironmq

You can get your `token` and `project_id` at http://www.iron.io .
Queues are created on the fly as you ask for them.

The Basics
=========

**Put** a message on a queue:

    var ironmq = require('ironmq')
    ironmq('token')
      .projects('project_id')
      .queues('my_queue')
      .put('hello world'
          , function callBack(err, obj) {
              obj.ids // array of ids posted
          })

**Get** a message from a queue:

    var ironmq = require('ironmq')
    ironmq('token')
      .projects('project_id')
      .queues('my_queue')
      .get(function callBack(err, msgs) {
              msgs    //array of msgs gotten
              var msg = msgs.pop()
              msg.id      // id of message
              msg.body    // message data
              msg.timeout // time until msg returns to queue
              msg.del     // function to delete this message
          })

When you pop/get a message from the queue, it will NOT be deleted. It will eventually go back onto the queue after
a timeout if you don't delete it (default timeout is 10 minutes).

**Delete** a message from a queue:

    var ironmq = require('ironmq')
    ironmq('token')
      .projects('project_id')
      .queues('my_queue')
      .del('message_id'
          , function callBack(err, obj) {
              obj.msg === 'Deleted'
          })

Delete a message from the queue when you're done with it.

Project Selection
===============

    // list projects
    var ironmq = require('ironmq')
    ironmq('token').list(function(err, obj) {
      obj  // array of project objects
    })

    var client  = ironmq('token')
    var project = client('project_id')

    var project = ironmq('token').projects('project_id')

    var project = ironmq('token')('project_id')

Queue Selection
===============

Similar to project selection, any of the following:

1. `project.list(function(err, obj){}` to get an array of queues
1. `var queue = project.queues('my_queue')`
1. `var queue = project('mq_queue')`

Queue Information
=================

    queue.info(function(err, obj) {
      obj.size    // number of msg's in this queue
      obj.time    // new Date when this size was gotten
      obj.get     // get messages from this queue
      obj.put     // put messages on this queue
      obj.del     // delete messages from this queue
      obj.info    // update the size property for this queue
    })

    project.queues('my_queue', function(err, queue) {})

    project('my_queue', function(err, queue) {})


Branching and Running the Tests
-------------------------------

<root-dir>
  /iron-mq-branch
  /node-modules

cd <root-dir>
npm install tap
npm install nock
npm install require

Running the tests:

node node-modules/tap/bin/tap.js iron-mq-branch/tests/*.js