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

	/**
	 *  Curry the project_id
	 */
	function projects(project_id)
	{
		var tasksPath = '/projects/' + project_id + '/tasks';

		/**
		 *  Curry the task_id
		 *  cb is a function.  Passing it is short hand for
		 *  tasks(task_id).info(cb)
		 */
		function tasks(task_id, cb)
		{

			// path to use for http message operations
			// at the task specific level
			var taskPath = tasksPath + task_id;

			// object to return
			var task =
			{
				info:    taskInfo,
				log:     taskLog,
				cancel:  taskCancel,
				progress:taskProgress,
				id:      function ()
				{
					return task_id
				}
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

				ironWorkerGet(url, null, cb);
			}

			function taskProgress(cb)
			{
				var url = taskPath + "/progress";

				ironWorkerGet(url, null, cb);
			}
		}

		/**
		 *  Returns a array of tasks for a given project
		 */
		tasks.list = function listTasks(pageIndex, perPage, cb)
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
		};

		tasks.id = function ()
		{
			return project_id;
		};

		// little sugar
		tasks.tasks = tasks;

		return tasks;
	}

	/*
	 *  Returns an array of projects for a given token
	 */
	projects.list = function listProjects(cb)
	{
		ironWorkerGet('/projects'
			, {}
			, function (err, obj)
			{
				if (!err) {
					obj = obj.projects.map(function(project) {
						return IronWorker(token)(project.id);
					});
				}

				cb(err, obj);
			});
	};

	// little sugar
	projects.projects = projects;

	return projects;

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

	function ironWorkerPut(path, body, cb)
	{
		request.post({ url:baseUrl + path, headers:headers}
			, parseResponse(cb))
			.end(JSON.stringify(body));
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

