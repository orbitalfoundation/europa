# THEORY

## Overview

The goal of this project is to define and exercise an SDL (scenario definition language) for expressing complex software systems, such as applications, made out of reusable parts with an emphasis on lightweight composability and formal security policies to allow such systems to run in third party sandboxes with some degree of trust.

Applications are often made up out of reusable components, third party libraries and services. Often, today an application is partially distributed, with some computation running locally on a consumer device, and other computation running in the cloud. Computation is often instanced in the cloud in such a way as to minimize latency or to ease access to larger data resources that are too large to run on device. In fact the application model no longer accurately represents modern computation. A more accurate model is that there is a computational soup of distributed agents, running often as separate threads or processes, occasionally across networks, and they are formed into an application only conceptually. Effectively an application is a "scenario" that contains a pool of agents that interact with each other. This is similar to the https://en.wikipedia.org/wiki/Actor_model .

There are many applications that many of us use every day. These applications are often produced out of a number of pieces. There is often some kind of manifest that declares libraries, modules and dependencies. There is often some kind of boot logic that orchestrates the system as a whole. This pattern shows up in rust cargo crates, in npm modules and even in single page apps on the web such as react apps.

Often when apps are shipped to devices such as the iphone or android there is a special emphasis on security and sandboxing perms and privs of those apps. They have to specially request access to services such as the camera or user storage or the network. Beyond this as well throttling their CPU access is important so that they don't saturate local computational resources. Security as a whole is poorly expressed industry wide, and instead we see a walled garden approach with a careful curation of app stores to prevent bad actors from publishing apps. This human intervention model however restricts healthy conversations on the net by censoring apps not just for safety and security but for the whims of the current walled garden vested interests.

Apps that run on the web have a further problem in that they don't have persistence, and they cannot run in the background.

And apps as a whole have a design defect in that they are modal - which is a pattern that reflects single focus devices but that doesn't reflect upcoming Augmented Reality interfaces where apps will instead be "decorators" that enhance or augment existing objects, or augment other apps, rather than being fully in control of a view.

To move to the next generation of apps, where apps can be granular, composed from existing pieces, distributed in a computational soup, where they can be trusted without relying on a walled garden as a trust broker, where they can augment existing views rather than owning the view and be durable and persistent helpful agents - a much more formal model of what an application is is needed.

The real value of the upcoming metaverse is not to merely decorate an augmented reality world with 3d geometry, art and other assets but to actually script behavior that can run in a durable and safe way, that others can view and interact with, and that doesn't overwhelm their view or in other ways provide a bad experience. If applications are expressed more formally they can take advantage of networks to fetch pieces, they can show up on devices and be reasonably scoped as to permissions and powers, and can be generally easily distributed without a walled garden. This also helps us be truly creative; to express and share ideas with digital agents, not with just static images. We could share living sketches of our ideas; vignettes, stories, games, architectural visions, procedurally generated music, art and other experiences that right now are relegated only to expert programers. If we can scope what apps are better then we give people powerful ways to speak and communicate ideas - not just one essay or one image or one idea - but a space of ideas that is an interactive exploration of a topic space. This may help us all navigate an increasingly complex future.

## Age of Synthesis

We live in a time where the real and the virtual are merging back together.

	- mixed reality hardware
	- digital twin projects
	- metaverses
	- spatial representation in general
	- effectively a playful world is emerging - as Marc Pesce says
	- one that we can program, participate in, contribute to

## What are apps historically?

	- we all use apps yet very few of us create apps
	- programming lets a creative assemble behaviors, art assets and the like into a whole experience

	- apps are bundles of content, libraries and scripting glue all wired together
		- rust apps are often built out of many rust crates wired together with a bit of rust code
		- javascript apps, such as react website, are often built out of many npm modules wired together
		- unity and unreal apps are similar; often using many packages, wired together with blueprints

		- apps run within operating systems, such as iOS, or Android or Roblox
		- operating systems are often walled gardens that use cryptography to limit who may publish

		- tools like unity or unreal use visual wiring schemes such as blueprints for simplicity
		- roblox uses lua scripting

		- a web page is an app, it is basically a manifest describing a bunch of pieces to load up and run
		- procedural components of apps are often expressed in c, c++, javascript, rust and so on

## Next Generation Apps

We can imagine a spectrum of new apps 

	- mark up the real world with post it notes or verbs
	- tools for telling stories with rich visual media
	- sense making; help people see risks and opportunities, durable, background apps
	- especially creative spatial programming;
		- creating a social ar musical instrument or a game in a park
		- or a farmer specifying the navigation route for their farmbot
		- or even play-testing the impacts of a new law on a community
		- the real world needs to be programmable; participatory, and open

## Parts required to deliver this vision

	- https://en.wikipedia.org/wiki/Actor_model
	- effectively complex agent soups - a different model of computation
	- apps are distributed, democratic computation recruited for a task
	- expose the existing fabric of services; weather services etc
	- agent and message based compositional frameworks
	- security permissions become critical

## SDLS are required

	- i've come to recognize that an application can be defined in a scenario definition language

	- there are many parts, data, components, content, rules, security permissions
	- semantic intent 

	- and there is a right sized, high level grammar for describing these systems

	- and that grammar should be accessible to novices, anybody should be able to
		wire a simple app together and share it with their peers

	- i've come to see applications as a form of a scenario definition

	- describing apps at the highest levels
	- libraries, components and resources
	- security and permissions
	- rules around where parts of an app are going to run
	- all the basic things we expect for different domains - for example for 3d graphics it would be:
		- physics
		- sensors
		- triggers
		- permissions

