
## Primary Goal: Exercising an SDL

The goal of this project is purely to exercise an SDL - to formalize what the grammar is, what services are needed, and how they are wired together.

To exercise an SDL the system 'pretends' to be a series of separated services although it's all in actually just a pile of javascript. The conceit is that there is a separation between an application execution environment, a set of services, and an sdl parser. Each piece pretends to be totally separated and talk to each other only via message bridges. If this is designed right then it should be possible to swap out each piece for equivalents written in other languages or for an embedded high performance environment.

## Architecture

### Bootstrapping

1) 'npm run start' invokes a small boothelper that runs _boothelper.js_ which injects the ability to use es6 import...

2) main.js starts a service/thread pool manager service - basically a thing that manages other services and their comms

3) the service manager receives messages and redirects them to other services, loading them if needed

4) one important service is the sdl grammar parser itself - this service is called 'flo'

5) another important service is a view - this opens up a window for rendering graphics into

6) different sdl grammar examples can be run by passing their name as an (optional) command line argument (phrased as an url)

### Service Design

In the real world there are many threads of computation networked together but running on different devices.
There also are traditional networking concerns such as persistence, replication, consistency, latency, shards.
The design here is intended to express these kinds of concepts: networking, persistence, agents, messaging.

For our implementation first we have a services manager - a service being effectively our core unit of computation.
This manager is reponsible for making sure messages get to a service. Also it makes and manages local services also.

	// services manager
	let services_manager_channel = new services_manager_channel()

	// you can tell it to make a service, it gives you back a message passing handle on that service effectively
	let channel = services_manager_channel.send({
		uuid:"root/myservices/service_1", // <- if this is supplied then this is the eventual uuid of the service
		service:"localhost:/services/flo",	// <- this service will be manufactured if needed
	})

	// a service message channel can be used for further communication rather than having to talk to the services manager
	let noresults = channel.send({dosomething:"cool"})

	// service message channels do not return any results!
	assert(noresults == null)

	// some service message channels may broadcast to you and you can listen to them - this is the only way to get feedback
	channel.listen((e)=>{console.log(e)})

	// some services can be closed if that makes sense to them
	channel.close()

## EXAMPLES

- some kind of simple multiplayer game

- a set of powerpoints that describe the project itself; maybe as cards

- some kind of real world place based games

- some kind of desktop for managing other apps; and playing with decorators and other ideas

- some kind of user interface in vr

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
