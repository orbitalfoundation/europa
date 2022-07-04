
///
/// Flo SDL Instance
///
/// Flo is an 'app runner' that loads and runs apps defined in a manifest - that enumerates services wired together and behaviors.
///
/// Flo provides a 'right sized' simple, high level grammar for describing applications made out of services.
/// At the moment I've decided that the right language is simply javascript.
///
/// An 'app' or 'application' in my mind is a fairly loose bucket, but has some key jobs:
///
///		+ define a collection of services (blobs of code that are loaded off disk - can be WASM or javascript right now)
///		+ define a bunch of relationships between those services (wires or routes that are explicitly built the manifest)
///		+ define any initial data passed to services
///		+ define security perms granted to services
///		+ perform actual high level procedural logic; basically the glue logic, lightweight event driven behaviors and scripting.
///


export default class Flo {

	constructor(args) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
	}

	///
	/// tell flo to do some work
	///

	async write(args) {
		let c = args && args.command ? args.command : "load"
		switch(c) {
			case "load": {
					let results = await this._load(args)
					return results
				}
			default:
				console.error({error:"Flo bad args"})
				console.error(args)
				return {error:"Flo bad args"}
		}
	}

	///
	/// let a third party register a listener with flo to listen to anything that flo publishes
	/// at the moment flo doesn't emit anything so there is no point in filling this method out
	///

	read(listener) {}

	///
	/// Load a manifest, which is a collection of one or more apps, and each app is a collection of services
	///

	async _load(args) {

		// load?
		if(!args.load) {
			console.error("Flo: no load url specified")
			return
		}

		let parts = args.load.split(':')
		let domain = 0
		let path = parts[parts.length-1]

		// perform load command
		// TODO later test http loads for now just load locally off disk 
		try {
			let modules = await import("../.."+path+".js")

			if(!modules) {
				console.error("Flo: bad file " + path)
				return
			}

			/*

			TODO remove all this?
				it is not really needed - right now i just procedurally manufacture each service on demand by hand by talking directly to the services layer
				but there is some argument for declarative expressions in that they let other parts of the system understand state more easily

			// TODO : later allow manifests to contain a variety of kinds of things -> arrays, objects, functions, deal with them all

			for(let [k,v] of Object.entries(modules)) {
				if(v instanceof Function) {
					// if there is an exported function then pass it some helpful state - it should return services produced
					// todo note there is no point in returning results because services aren't really static
					// also flo could just inject a watcher if it wanted to know what the manifest was doing
					//let some_services =
					await v({_services:this._services,_flo:this})
				}
				else if((v instanceof Object)) {
					// or if there is a hash - treat it like a service declaration and try produce it as a service
					let a_service = await this._app(k,v)
				}
				// could store the services found
			}

			*/

		} catch(err) {
			console.error(err)
		}
	}

	/*

	///
	/// Walk through the manifest - manufacturing all the services (by leveraging the services manager)
	/// TODO this may now be entirely obsolete given that i am procedurally declaring services on demand in the loaded script
	///

	async _app(name,manifest) {

		console.log("Flo: chewing through manifest - original manifest name was =" + name )

		let services=[]

		// ask the services manager to make the top level services in this manifest
		// injects a back pointer to flo into the message - so .flo is also reserved

		for(let [k,v] of Object.entries(manifest)) {
			if(v instanceof Object) {
				switch(v.kind) {
					case "service":
						v._flo = this
						let service = await this._services.send(v)
						services.push(service)
						break
					default:
						console.error("Flo: unknown manifest entry")
						console.error(v)
						break
				}
			} else {
				console.error("flo: illegal item in manifest")
			}
		}

		manifest.services = services
	}

	*/

}


/* todo - remove this factory completely - it turns out that it is better to simply have the services manager do all this


///
/// FloFactory
///
/// Because this is the default export, the service loader is going to call this when messages are sent generically to the service
///
/// For each generic request of 'flo' now go ahead and manufacture a fresh flo instance and then forward the request onwards
///
///

export default class FloFactory {

	constructor(args) {
		// the caller (typically services manager) MUST supply a services chanenl for any traffic this service wishes to send to anybody else
		this._services = args._services
		// the caller (typically services manager) MUST specify where it would like this service to be mounted
		this.uuid = args.uuid || args.service
		this.mountcounter = 0
	}

	async channel(args) {

		// if no special command is specified then assume that the caller intention is to spin up a new flo parser
		let c = args && args.flo_command ? args.flo_command : "load"

		switch(c) {
			case "load":
				// instance a copy of the manifest parser
				await this._load(args)
				break
			default:
				// unknown command - no other commands are handled yet
				console.error({error:"FloFactory: unknown command "})
				console.error(args)
				return {error:"FloFactory: unknown command"}
		}

	}

	///
	/// spin up a new instance of flo - and forward the traffic onwards
	///

	async _load(args) {

		// set a mount point for the instance
		this.mountcounter++
		args.uuid = this.uuid + "/" + this.mountcounter

		// make a flo service instance here right now
		// (the outer scope services manager doesn't see the class instance decl so it cannot make it - in the current design)
		let instance = new Flo(args)

		// tell the services manager to remember how to reach this newly created child service
		this._services({
			uuid:"services",
			command:"register",
			use_uuid:args.uuid,
			channel:instance.channel
		})

		// pass the first command - while this command is passed on the constructor it is best to handle it now after setup
		instance.channel(args)
	}
}
*/

