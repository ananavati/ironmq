var url = require('url');
var request = require('request');
var qs = require('querystring');

var rootUrl = 'worker-aws-us-east-1.iron.io';

/**
 * Main entry point.  The whole implementation is
 * just currying token, project_id, queue_name inorder to
 * get, put, del messages
 *
 * token is the secret you will get from Iron.io
 *
 * op is an option object supporting
 * protocol
 * host
 * port
 * api_version
 *
 * These values are mostly for testing.  I have no idea
 * why you would want to change them in the real world.
 */
var IronWorker = module.exports = function (token, op)
{

	op = op || {};

	var headers = {
		'Authorization':'OAuth ' + token,
		'Content-Type':'application/json',
		'User-Agent': 'IronWorker Node Client'};

	var api_ver = '2';

	var baseUrl = url.format({
								 protocol: op.protocol || 'https',
								 hostname: op.host || rootUrl,
								 port:op.port || 443,
								 pathname:'/' + api_ver
							 });

	var client = {
		listProjects: listProjects,
		projects: projects
	};

	return client;


	// Implementation

	function projects(project_id)
	{
		var tasksPath = '/projects/' + project_id + '/tasks';
		var scheduledTasksPath = '/projects/' + project_id + '/schedules';

		var project = {
			id: id,
			listTasks: listTasks,
			queueTask: queueTask,
			hookTask: hookTask,
			tasks: tasks,
			listScheduledTasks: listScheduledTasks,
			scheduleTask: scheduleTask,
			scheduledTasks: scheduledTasks
		};

		return project;

		// Implementation

		function id()
		{
			return project_id;
		}

		function tasks(task_id, cb)
		{

			// path to use for http message operations
			// at the task specific level
			var taskPath = tasksPath + "/" + task_id;

			// object to return
			var task =
			{
				info:    taskInfo,
				log:     taskLog,
				cancel:  taskCancel,
				progress:taskProgress,
				id:      id
			};

			if (typeof cb === 'function')
			{
				task.info(cb)
			}

			return task;

			//Implementation

			function taskInfo(cb)
			{
				var url = taskPath;

				ironWorkerGet(url, null, cb)
			}

			function taskLog(cb)
			{
				var url = taskPath + "/log";

				ironWorkerGet(url, null, cb);
			}

			function taskCancel(cb)
			{
				var url = taskPath + "/cancel";

				ironWorkerPostSimple(url, null, cb);
			}

			function taskProgress(percent,msg,cb)
			{
				var url = taskPath + "/progress";

				var progress = {
					"percent": percent,
					"msg": msg
				};

				ironWorkerPost(url, progress, cb);
			}

			function id()
			{
				return task_id;
			}
		}

		function scheduledTasks(schedule_id, cb)
		{
			var scheduledTaskPath = scheduledTasksPath + "/" + schedule_id;

			var schedule =
			{
				info:    scheduleInfo,
				cancel:  scheduleCancel,
				id:      id
			};

			if (typeof cb === 'function')
			{
				schedule.info(cb)
			}

			return schedule;

			//Implementation

			function id()
			{
				return schedule_id;
			}

			function scheduleInfo(cb)
			{
				var url = scheduledTaskPath;

				ironWorkerGet(url, null, cb)
			}

			function scheduleCancel(cb)
			{
				var url = scheduledTaskPath + "/cancel";

				ironWorkerPostSimple(url, null, cb);
			}
		}

		function listTasks(pageIndex, perPage, cb)
		{
			if (typeof pageIndex === 'function')
			{
				cb = pageIndex;
				pageIndex = 0;
				perPage = 0;
			}
			else if (typeof perPage === 'function')
			{
				cb = perPage;
				perPage = 0;
			}

			var url = tasksPath;
			var params = {
				page:    pageIndex,
				per_page:perPage
			};

			ironWorkerGet(url, params, function (err, obj)
			{
				if (!err)
				{
					obj = obj.tasks.map(function(task) {
						var tmp = tasks(task.id);
						// tmp.Timestamper = task.Timestamper;
						return tmp;
					});
				}

				cb(err, obj);
			});
		}

		function queueTask(codeName, payload, priority, timeout, delay, cb)
		{
			if (typeof priority === 'function')
			{
				cb = priority;
				priority = null;
				timeout = null;
				delay = null;
			}
			else if (typeof timeout === 'function')
			{
				cb = timeout;
				timeout = null;
				delay = null;
			}
			else if (typeof delay === 'function')
			{
				cb = timeout;
				delay = null;
			}

			var url = tasksPath;
			var task = {
				"code_name": codeName,
				"payload": payload
			};

			if (priority !== null)
				task.priority = priority;

			if (timeout !== null)
				task.priority = timeout;

			if (delay !== null)
				task.priority = delay;

			var params = {
				"tasks" : [task]
			};

			ironWorkerPost(url, params, cb);
		}

		function hookTask(codeName, payload, cb)
		{
			var url = tasksPath + "/webhook?code_name=" + codeName;

			ironWorkerPostSimple(url, payload, cb);
		}

		function listScheduledTasks(pageIndex, perPage, cb)
		{
			if (typeof pageIndex === 'function')
			{
				cb = pageIndex;
				pageIndex = 0;
				perPage = 0;
			}
			else if (typeof perPage === 'function')
			{
				cb = perPage;
				perPage = 0;
			}

			var url = scheduledTasksPath;
			var params = {
				page:    pageIndex,
				per_page:perPage
			};

			ironWorkerGet(url, params, function (err, obj)
			{
				if (!err)
				{
					obj = obj.schedules.map(function(schedule) {
						var tmp = scheduledTasks(schedule.id);
						return tmp;
					});
				}

				cb(err, obj);
			});
		}

		function scheduleTask(codeName, payload, properties, cb)
		{
			if (typeof properties === 'function')
			{
				cb = properties;
				properties = null;
			}

			var url = scheduledTasksPath;
			var schedule = {
				"code_name": codeName,
				"payload": payload
			};

			// merge in extra provided params
			if (properties !== null)
			{
				var keys = Object.keys(properties);
				var numKeys = keys.length;

				for (var i = 0; i<numKeys; i++)
				{
					schedule[keys[i]] = properties[keys[i]];
				}
			}

			var params = {
				"schedules" : [schedule]
			};

			ironWorkerPost(url, params, cb);
		}
	}

	function listProjects(cb)
	{
		ironWorkerGet('/projects'
			, {}
			, function (err, obj)
			{
				if (!err) {
					obj = obj.projects.map(function(project) {
						return IronWorker(token).projects(project.id);
					});
				}

				cb(err, obj);
			});
	}

	//Transport implementation

	function ironWorkerGet(path, params, cb)
	{
		var search;

		if (params != null)
		{
			search = qs.stringify(params);
		}

		search = search ? ('?' + search) : '';

		var url = baseUrl + path + search;

		request.get(
			{
				url: url,
				headers: headers
			}, parseResponse(cb))
			.end();
	}

	function ironWorkerPost(path, body, cb)
	{
		var jsonBody = JSON.stringify(body);

		ironWorkerPostSimple(path,jsonBody,cb);
	}

	function ironWorkerPostSimple(path, body, cb)
	{
		request.post({ url:baseUrl + path, headers:headers}
			, parseResponse(cb))
			.end(body);
	}

	function ironWorkerDel(path, cb)
	{
		request.del({ url:baseUrl + path, headers:headers}
			, parseResponse(cb))
			.end();
	}
};

/**
 *  one function to handle all the return errors
 */
function parseResponse(cb)
{
	return function parse(err, response, body)
	{
		var result;

		if (response.headers["content-type"] == "application/json")
		{
			result = JSON.parse(body);
		}
		else
		{
			result = body;
		}

		// TODO Handle the errors
		cb(err, result);
	}
}

