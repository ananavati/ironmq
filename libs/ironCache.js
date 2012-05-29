var url = require('url');
var request = require('request');
var qs = require('querystring');

var rootUrl = 'cache-aws-us-east-1.iron.io';

var IronCache = module.exports = function (token, op)
{

	op = op || {};

	var headers = {
		'Authorization':'OAuth ' + token,
		'Content-Type':'application/json',
		'User-Agent': 'IronCache Node Client'};

	var api_ver = '1';

	var baseUrl = url.format({
								 protocol: op.protocol || 'https',
								 hostname: op.host || rootUrl,
								 port:op.port || 443,
								 pathname:'/' + api_ver
							 });

	var client = {
		projects: projects
	};

	return client;


	// Implementation

	function projects(project_id)
	{
		var cachesPath = '/projects/' + project_id + '/caches';

		var project = {
			id: function () { return project_id; },

			// tasks
			listCaches: listCaches,
			caches: caches
		};

		return project;

		// Implementation

		function listCaches(pageIndex, cb)
		{
			if (typeof pageIndex === 'function')
			{
				cb = pageIndex;
				pageIndex = null;
			}

			var url = cachesPath;
			var params = {};

			if (pageIndex !== null)
				params.page = pageIndex;

			ironCacheGet(url, params, function (err, obj)
			{
				if (!err)
				{
					obj = obj.codes.map(function(cache) {
						var tmp = caches(cache.name);
						return tmp;
					});
				}

				cb(err, obj);
			});
		}

		function caches(cache_name)
		{
			var cachePath = cachesPath + "/" + cache_name;

			var cache =
			{
				id:      	function () { return cache_name; },
				put:    	cachePut,
				inc:     	cacheIncrement,
				get:  		cacheGet,
				delete:		cacheDelete
			};

			return cache;

			//Implementation

			function cachePut(key,value,expires_in,replace,add,cb)
			{
				if (typeof expires_in === 'function')
				{
					cb = expires_in;
					expires_in = null;
					replace = null;
					add = null;
				}
				else if (typeof replace === 'function')
				{
					cb = replace;
					replace = null;
					add = null;
				}
				else if (typeof add === 'function')
				{
					cb = add;
					add = null;
				}

				var url = cachesPath;
				var params = {};

				if (expires_in !== null)
					params.expires_in = expires_in;

				if (replace !== null)
					params.replace = replace;

				if (add != null)
					params.add = add;

				params.body = value;

				var url = cachePath + "/items/" + key;

				ironCachePut(url, params, cb);
			}

			function cacheIncrement(key,amount,cb)
			{
				var url = cachePath + "/items/" + key + "/increment";
				var params = {
					amount: amount
				};

				ironCachePost(url, params, cb);
			}

			function cacheGet(key,cb)
			{
				var url = cachePath + "/items/" + key;

				ironCacheGet(url, null, cb);
			}

			function cacheDelete(key,cb)
			{
				var url = cachePath + "/items/" + key;

				ironCacheDel(url, cb);
			}
		}
	}

	//Transport implementation

	function ironCacheGet(path, params, cb)
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

	function ironCachePut(path, body, cb)
	{
		var jsonBody = JSON.stringify(body);

		request.put({ url:baseUrl + path, headers: headers}
			, parseResponse(cb))
			.end(jsonBody);
	}

	function ironCachePost(path, body, cb)
	{
		var jsonBody = JSON.stringify(body);

		ironCachePostSimple(path,jsonBody,cb);
	}

	function ironCachePostSimple(path, body, cb)
	{
		request.post({ url:baseUrl + path, headers:headers}
			, parseResponse(cb))
			.end(body);
	}

	function ironCacheDel(path, cb)
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

