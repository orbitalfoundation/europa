# jun 14

	* revised channel creation philosophy to be more network friendly and added to technical

# jun 13

	// this leaves me with actual networking

	// my apps are actually downloaded from a given server, so they can talk to that server by default: one server = one database
	// i think i have to have a real persistence service that can be invoked at will from various places
	// since there can be zillions of clients running zillions of apps, it is important to be able to segment traffic
	// there isn't just one global namespace with like /tree and so on, it would be probably more like /joesarea/joesgame1/tree
	// and you would specify to persistence what you are observing
	// this would be based on the most recent websockets stuff that i wrote, and the burden is primarily on the server
	// so i would beef out the server side to handle the events and the sockets properly for a single server database model
	// although presumably a client can connect to other servers (a sharding model)

	// i can talk specifically to the networking in my actual app if i wish

		let persistence = channels.open({persistence})
		persistence.send({initial dataset})
		persistence.listen(()=>{ copy changes over to view })
		persistence.send(()=>{ any changes i want to send })

	// or i could bury that inside the view - and i can be more intelligent about filtering traffic

		fancypersistence <- this may be attached to the view directly

		- in my last implementation i only sent changes if they were significant
		- and also i had a timer so that only the most recent change after a moment was sent; i blocked thrashing the server
		- also i may want to federate traffic
		- and i may want to have distance based attenuation

	// now when i start up my app ( /desktop ) -> which i may want to rename 'sharedworkspace' or something
	// i can either explicitly also start persistence
	// or i can just flag it as something i want the view() to deal with

		let persistence = channels.open({})
		channels.open({view}).send({initial dataset}).receive(()=>{})
		persistence.send({initial dataset})
		persistence.listen(()=>{ copy changes over to view })
		persistence.send(()=>{ any changes i want to send })


	// i guess in theory apps can talk directly to each other as well - no server side persistence is needed really
	// the networking model doesn't have any state at the server - although i may want to know the identities of all other clients
	// and i can just ask a remote client for all state (a reflektor can resolve some of those chores also)




# june 12 2022

	* turn off electron for now

	* crude event handling

	- networking

	- buttons

	- document nodes and architecture




- testing 2d layout and stuff

	- philosophically 2d elements are like html dom nodes, they are multi-talented and each does just about everything
	- i want to render these to texture render targets, and allow remixing
	- also i want some layout powers and generally i want to be able to tell good stories, buttons, text, and layout, animation

	- bring up a 2d display

	- draw text, boxes, fonts, colors and so on in a controlled way

	- buttons widgets draggable panels with overflow

	- animations and style and layout capabilities

- testing 3d stuff

	- 3d graph segments, add, remove, update frags, network all this?
	- turn nodes off and on
	- camera controls

	- collision handling in the core and pipe events up to user land

	- bonus
		- semantic placement
		- network
		- collision
		- physics
		- procedural and parametric effects engines?

	- texture
	- glbs
	- lights
	- ribbons?
	- particle fx

	- avatars specifically

		- think about networking of, cameras, events and so on


- event finalization

	- have to think through how say a view service propagates events back to a handler

	- think about networking also
