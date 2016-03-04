(function() {
    module.exports.run = function(services) {
        recursivePrint([], services);
    };

    module.exports.getHostname = function(serviceName, shard) {
	return serviceName + '.' + shard;
    };

    var makeServiceName = function(prefix, name) {
	if (!prefix || prefix.length == 0) {
		return name;
	}
        if (name.indexOf(".") != -1) {
		return name;
	}
	return prefix.join(".") + "." + name;
    };

    var recursivePrint = function(prefix, services) {
	if (!services) {
		return;
	}
	for (var key in services) {
		var service = services[key];
                if (!service.subservices) {
			console.log(makeServiceName(prefix, service.name) + ":");
                        console.log("\t" + service.replicas + " replicas");
		} else {
			prefix.push(service.name);
			recursivePrint(prefix, service.subservices);
			prefix.pop();
		}

		if (service.depends && service.depends.length) {
			for (var i = 0; i < service.depends.length; i++) {	
				var dependency = service.depends[i];
				console.log(makeServiceName(prefix, service.name) + " depends on " + makeServiceName(prefix, dependency));
			}
		}
	}
    };
}());

