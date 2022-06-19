# Orbital SDL

## Areas of Focus

This project seeks to formalize an SDL - a scenario definition language - for describing entire applications out of dynamically loaded services such as third party libraries.

Since each service is treated as a separate thread the only way that services can communicate is with messages, and effectively an agent based model is presumed - see: https://en.wikipedia.org/wiki/Agent-based_model .

There's also an emphasis on being able to define security around each service. 

To exercise an SDL the system 'pretends' to be a series of separated services although it's all in actually just a pile of javascript. The conceit is that there is a separation between an application execution environment, a set of services, and an sdl parser. Each piece pretends to be totally separated and talk to each other only via message bridges. If this is designed right then it should be possible to swap out each piece for equivalents written in other languages or for an embedded high performance environment such as WASM.

## Running - in a web page

* cd server
* node server.js

## Running - using electron (this is incomplete)

* cd electron
* npm install
* npm run start [path]

path -> you can also here specify an optional url to example - will run a default example otherwise

