
## Architecture

### Bootstrapping

1) Somebody, say a sysadmin, mounts and runs the server. The server itself has two separate jobs - it serves both app itself using http and also runs a persistence service with web socket support.

2) A client then fetches and runs the app using a vanilla web browser such as Firefox. The app is packaged as an html page. The pattern is that in this web page the first job is to run a critical service, the SERVICES manager.

3) SERVICES is then asked to spawn an instance of 'flo' which is our manifest parser and runner. In say a rust environment this entire service would be mounted and run - and could be a copy of the v8 engine or spidermonkey but on the web this is a somewhat arbitrary distinction - basically we just run the specified application script from the same environmental engine.

4) Flo then loads the application manifest (there are several demos) and that application manufactures any further services.

### Electron

Electron is broken atm.

But in general it wraps the above in a couple more pieces:

1) A server should be run anyway - even if the app itself is not being fetched from it. It is needed for multiplayer.

2) 'npm run start' invokes a small boothelper that runs _boothelper.js_ which injects the ability to use es6 import...

3) The system flows into the process above...

### Services Philosophy

In the real world there are many threads of computation networked together but running on different devices.
There also are traditional networking concerns such as persistence, replication, consistency, latency, shards.
The design here is intended to express these kinds of concepts: networking, persistence, agents, messaging.

For our implementation first we have a services manager - a service being effectively our core unit of computation.
This manager is reponsible for making sure messages get to a service. Also it makes and manages local services also.

	// services manager
	let services_manager = new services_manager()

	// you can tell it to make a service, it gives you back a message passing handle on that service effectively
	let channel = services_manager.channel({
		uuid:"root/myservices/service_1", // <- if this is supplied then this is the eventual uuid of the service
		service:"localhost:/services/flo",	// <- this service will be manufactured if needed
	})

	// a service message channel can be used for further communication rather than having to talk to the services manager
	let noresults = channel.write({dosomething:"cool"})

	// service message channels do not return any results!
	assert(noresults == null)

	// some service message channels may broadcast to you and you can listen to them - this is the only way to get feedback
	channel.read((e)=>{console.log(e)})

	// some services can be closed if that makes sense to them
	channel.close()

## Example apps

1. A trivial example such as a clock

2. A kind of multiplayer shared workspace / metaverse / desktopy thing that lets you open and close apps and collaborate

3. a set of powerpoints that describe the project itself; maybe as cards

4. some kind of real world place based games

5. Simulation of a farm robot

6. A video game or app with many dependencies

7. A sandboxed example

8. Events routing example

9. An example of dynamically or late loading an applet into an existing multiplayer vr world

10. An example of an in game editor that is multiplayer

11. An AR example

12. An example of layering visual elements; such as putting a person in a car, or a robot arm on a spinning disk

13. An audio toy such as theremin

14. A place based AR game with NFTS - such as pacman

15. A streaming assets solution

16. An agent soup such as an ecosystem simulator
