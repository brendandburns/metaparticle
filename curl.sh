#!/bin/bash

curl -X POST \
     -d '{"jsonrpc": "2.0", "params":[{"foo": "bar"}], "method": "my-service", "id": "foobar"}' \
     -H "Content-Type: application/json" \
     -s localhost:3000/ \
     | jq .result.network.eth1[0].address
