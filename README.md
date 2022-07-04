# Orbital SDL

## Overview

This is a project to formalize an SDL or 'scenario definition language' to describe entire applications out of parts.

Goals are:

	- novice programmer, lo-code friendly
	- let users build applications out of services by declaring services and wiring them together
	- let users distribute the concept of an 'app' over the net rather than necessarily all on device
	- let users define security models and computational limits so that apps can be sandboxed well

Agent based models seem similar: https://en.wikipedia.org/wiki/Agent-based_model

To exercise an SDL the system 'pretends' to be a series of separated services although it's all in actually just a pile of javascript. The conceit is that there is a separation between an application execution environment, a set of services, and an sdl parser. Each piece pretends to be totally separated and talk to each other only via message bridges. If this is designed right then it should be possible to swap out each piece for equivalents written in other languages or for an embedded high performance environment such as WASM.

## Running - in a web page

* cd server
* node server.js

## Deploying

* gcloud run deploy --source .

## Running - using electron (this is broken atm)

* cd electron
* npm install
* npm run start [path] # -> you can also here specify an optional url to example - will run a default example otherwise

