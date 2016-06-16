#!/bin/bash

# TODO: I'm going to regret writing this in bash, convert to mocha

_exit() {
	node examples/server.js delete
	echo "OK"
}

trap "_exit" 0

node examples/server.js

out=$(node client.js simple-service)

if [[ "${out}" != "{\"A\":{\"foo\":\"bar\"}}" ]]; then
	echo "Unexpected output: ${out}"
	echo "FAIL"
	exit 1
fi
