var jayson = require('jayson');

// create a client
var client = jayson.client.http({
  port: 3000
});

client.request(process.argv[2], [{'foo': 'bar'}], function(err, response) {
  if(err) throw err;
  console.log(JSON.stringify(response.result)); 
});
