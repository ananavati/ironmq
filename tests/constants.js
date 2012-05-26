
// place to control values for each test
exports.token     	= 'test_token';
exports.projectId   = '4e25e1d35c0dd2780100048d';
exports.queue       = 'my_queue';
exports.taskId 	  	= 'my_task';
exports.codeId 		= 'my_code';

// way to turn off nock and actually send the requests to iron.io
exports.proxy     = true;

exports.ironWorkerRootUrl = 'worker-aws-us-east-1.iron.io';
exports.ironWorkerUserAgent = 'IronWorker Node Client';