
///
/// Flo SDL
///
/// Produce whatever is specified in our SDL (Scenario Definition Language)
///
/// The SDL describes collections of objects as a DAG [https://www.techopedia.com/definition/5739/directed-acyclic-graph-dag]
///
/// An SDL document is refered to as a 'manifest'.
/// Overall an SDL produces one or more 'applications'.
/// The top level objects in an SDL are descriptions of 'services' written in JS or WASM and are manufactured as separate threads.
///
/// A typical manifest may look like so:
///
///  Manifest
///     Application
///        Service
///        Service
///        Service
///        Service
///		   Routes
///		   Routes
///     Application
///        Service
///        Service
///        Service
///        Service
///		   Routes
///
/// The SDL can wire services together as well using routes. A route is effectively a message channel between threads.
///


export default class Flo {

	constructor(args) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
	}

	async send(args) {
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
	/// Flo doesn't send any messages right now
	///

	listen() {

	}

	///
	/// Load a manifest, which is a collection of one or more apps, and each app is a collection of services
	///

	async _load(args) {

		// load?
		if(!args.load) {
			console.error("Flo: no load url specified")
			return
		}

		// TODO support networks
		if(!args.load.startsWith("localhost:")) {
			console.error("Flo: only localhost allowed")
			return
		}

		// perform load command - later test http loads for now just load locally off disk todo
		try {
			let path = "../.."+args.load.substring("localhost:".length)+".js"

			let modules = await import(path)

			if(!modules) {
				console.error("Flo: bad file " + path)
				return
			}

			// TODO : later allow manifests to contain a variety of kinds of things -> arrays, objects, functions, deal with them all

			for(let [k,v] of Object.entries(modules)) {
				if(v instanceof Function) {
					// if there is an exported function then pass it some helpful state - it should return services produced
					// todo note there is no point in returning results because services aren't really static
					// also flo could just inject a watcher if it wanted to know what the manifest was doing
					//let some_services =
					await v({_services:this._services,flo:this})
				}
				else if((v instanceof Object)) {
					// or if there is a hash - treat it like a service declaration and try produce it as a service
					let a_service = await this._app(k,v)
				}
				// could store the services found
			}

		} catch(err) {
			console.error(err)
		}
	}

	///
	/// Walk through the manifest - manufacturing all the services (by leveraging the services manager)
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
}


/* - may not need a factory


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

