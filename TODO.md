# TODO

	* server up on net

	- a desktop should have a list of other apps that can also be loaded and run (static for now)
		- actually load on demand
		- effectively apps are urls; so the list of apps is really just a list of urls
		- need a way to paint to camera context
		- and camera should be removed from scenegraph completely and be something that is a shared resource
		- let us statically set the rooms as apps for now

	- server immprovements
		- filtering per room net traffic
		- persistance

# SDL DOCS V1

	* General overall goals

		- modular dynamic late composition of services
		- computational soup
		- manifest or simple grammar

	* architecture

		* Services Manager
			* spawns services and messages them
			* has a mechanism for generating a uuid locally that is somewhat durable
			- [later] securely load better over networks
			- [later] user can supply a uuid based on a public/private auth such as metamask or keplr

		* Flo - Manifest Runner
			* Loads and runs manifests

		* View
			* Basics are in place and it works well
			- box with colors and materials and pose
			- gltf
			- light
			- camera
			- a button
				- catch press event
				- return click event
				- stylable
			- layout tool
				- layout a keyboard for example
			- 2d elements
			- flesh out more basic types and showcase; including 2d elements, buttons; need a demo to showcase all + cards view

		* Net
			* Basics are in place and multiplayer scenarios are easy to build and look good
			* Server has a concept of merging state and only publishing actually significant changes
			~ Observe publishes everything; should only publish query subset and changes thereof
			~ Durable persistence?
			- COULD HAVE SMART RULES LIKE AN OBJ CANNOT MOVE SUPER FAR
			- need to think through how to late late joiners not overwrite default content
			- camera needs thought re networkign

		- some kind of ai module as an example

	* examples

		- a clock
		- a button
		- a desktop?
		- a network demo
		- cherry blossom vignette

## Version 1: Stories

<<<
	* Demo 0 - scenario picker

	* Demo 1 - network
		- pick a room to join; limit traffic to that room
		- avatar picker for now (later profile edit)

		* Participant mobility
		- let people spawn their own levels or worlds, and flush, reset, set who can join 
		- Collisions
		- Walkable surfaces
		- example workbenches; working interfaces
		- can we package and re-use behaviors?

<<<
	- Demo 2 - Cherry Blossom vignette
		- how can i load an app -> can i have a button? is this multiplayer if loaded into multiplayer room?
		- particle effects

<<<
	- Demo 3 - Presentation
		- Document using app itself, do a writeup and release, or document in miro


## Version 2:

	* Venice App Demo
		- let people add geometry
		- avatar selection
		- Shared object spawning and dragging
		- video conf

	* Documentation App
		- cards

	* Client overall
		- signed apps

	* Networking improve
		- durable persistence
		- network physics also
		- traffic filtering
		- test multiple shards

## Version x

	- make a ton of 2d basic elements
		- can i have a button
		- can i have a 3d button
		- can i have a card
		- card layouts
		- general information layous
		- text overall; fitting boxes
		- fonts
		- colors
		- boxes, circles
		- animation

## Version x: 3d to improve

	- 3d graph segments, add, remove, update frags
	- turn nodes off and on
	- camera controls

	- collision handling in the core and pipe events up to user land

	- bonus
		- semantic placement
		- collision
		- physics
		- procedural and parametric effects engines?

	- texture
	- glbs
	- lights
	- ribbons?
	- particle fx
