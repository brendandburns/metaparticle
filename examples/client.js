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

var obj = {'foo': 'bar'};
if (process.argv.length > 3) {
   log.info("Loading object from command line");
   obj = JSON.parse(process.argv[3]);
}

client.request(process.argv[2], [obj], function(err, response) {
  if(err) throw err;
  //console.log(response);
  console.log(JSON.stringify(response.result)); 
});
