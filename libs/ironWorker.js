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
		var codePackagesPath = '/projects/' + project_id + '/codes';

		var project = {
			id: function () { return project_id; },

			// tasks
			listTasks: listTasks,
			queueTask: queueTask,
			hookTask: hookTask,
			tasks: tasks,

			// scheduled tasks
			listScheduledTasks: listScheduledTasks,
			scheduleTask: scheduleTask,
			scheduledTasks: scheduledTasks,

			// code packages
			listCodePackages: listCodePackages,
			codePackages: codePackages
		};

		return project;

		// Implementation

		function tasks(task_id, cb)
		{
			var taskPath = tasksPath + "/" + task_id;

			var task =
			{
				id:      function () { return task_id; },
				info:    taskInfo,
				log:     taskLog,
				cancel:  taskCancel,
				progress:taskProgress
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
		}

		function scheduledTasks(schedule_id, cb)
		{
			var scheduledTaskPath = scheduledTasksPath + "/" + schedule_id;

			var schedule =
			{
				id:      function () { return schedule_id; },
				info:    scheduleInfo,
				cancel:  scheduleCancel
			};

			if (typeof cb === 'function')
			{
				schedule.info(cb)
			}

			return schedule;

			//Implementation

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

		function codePackages(code_id, cb)
		{
			var codePackagePath = codePackagesPath + "/" + code_id;

			var codePackage =
			{
				id:      	function id() { return code_id; },
				info:    	codePackageInfo,
				delete:  	codePackageDelete,
				download: 	codePackageDownload,
				revisions: 	codePackageRevisions
			};

			if (typeof cb === 'function')
			{
				codePackage.info(cb)
			}

			return codePackage;

			//Implementation

			function codePackageInfo(cb)
			{
				var url = codePackagePath;

				ironWorkerGet(url, null, cb)
			}

			function codePackageDelete(cb)
			{
				var url = codePackagePath;

				ironWorkerDel(url, cb)
			}

			function codePackageDownload(cb)
			{
				var url = codePackagePath + "/download";

				ironWorkerGet(url, null, cb);
			}

			function codePackageRevisions(pageIndex,perPage,cb)
			{
				if (typeof pageIndex === 'function')
				{
					cb = pageIndex;
					pageIndex = null;
					perPage = null;
				}
				else if (typeof perPage === 'function')
				{
					cb = perPage;
					perPage = null;
				}

				var url = codePackagePath + "/revisions";
				var params = {};

				if (pageIndex !== null)
					params.page = pageIndex;

				if (perPage !== null)
					params.per_page = perPage;

				ironWorkerGet(url, params, function (err, obj)
				{
					if (!err)
					{
						obj = obj.revisions;
					}

					cb(err, obj);
				});
			}
		}

		function listTasks(pageIndex, perPage, cb)
		{
			if (typeof pageIndex === 'function')
			{
				cb = pageIndex;
				pageIndex = null;
				perPage = null;
			}
			else if (typeof perPage === 'function')
			{
				cb = perPage;
				perPage = null;
			}

			var url = tasksPath;
			var params = {};

			if (pageIndex !== null)
				params.page = pageIndex;

			if (perPage !== null)
				params.per_page = perPage;

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
				pageIndex = null;
				perPage = null;
			}
			else if (typeof perPage === 'function')
			{
				cb = perPage;
				perPage = null;
			}

			var url = scheduledTasksPath;
			var params = {};

			if (pageIndex !== null)
				params.page = pageIndex;

			if (perPage !== null)
				params.per_page = perPage;

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

		function listCodePackages(pageIndex, perPage, cb)
		{
			if (typeof pageIndex === 'function')
			{
				cb = pageIndex;
				pageIndex = null;
				perPage = null;
			}
			else if (typeof perPage === 'function')
			{
				cb = perPage;
				perPage = null;
			}

			var url = codePackagesPath;
			var params = {};

			if (pageIndex !== null)
				params.page = pageIndex;

			if (perPage !== null)
				params.per_page = perPage;

			ironWorkerGet(url, params, function (err, obj)
			{
				if (!err)
				{
					obj = obj.codes.map(function(codePackage) {
						var tmp = codePackages(codePackage.id);
						return tmp;
					});
				}

				cb(err, obj);
			});
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

