var jayson = require('jayson');
var log = require('loglevel');

// create a client
var client = jayson.client.http({
  port: 3000
});

client.on('http request', (req) => {
	log.debug("REQUEST:");
	log.debug(req);
});

client.request(process.argv[2], [{'foo': 'bar'}], function(err, response) {
  if(err) throw err;
  console.log(JSON.stringify(response.result)); 
});
