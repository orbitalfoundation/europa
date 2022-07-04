
///
/// Service Manager
///
/// A message router and also can load, instance and manage other services. This is effectively the kernel of the product.
///
/// Message payload
///
///		uuid: -> reserved token -> a specific service instance (must provide this OR a service)
///		service: -> reserved token -> a unique identifier for the service (must provide this OR a uuid)
///		...		 -> other arguments for the service (passed through but otherwise ignored)
///
/// Service identifier is a urn like identifier:
///
///		[domain segment]:[service name]:[optional checksum]:[optional signature]
///
///		domain segment: -> a specific domain such as 'orbital.github.io' or '*' or nothing -> meaning nearest upstream provider
///
///		service name: -> a locally unique name for a service, this translates to an actual file path in current architecture
///
/// Notes / TODO:
///
///		We need package signing: https://blog.tidelift.com/the-state-of-package-signing-across-package-managers
///

class Services {

	constructor(args=0) {
		this.counter = 0
		this._service_canonical = {}
		this._service_instances = { "services": this } // this service itself can be messaged at 'services'
		if(args)this.channel(args) // pass args through on constructor if any
	}

	///
	/// uuid helper
	/// TODO - prefix a local domain to reduce collisions between instances of services for networking in general
	/// 

	uuidv4() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16) )
	}

	durable_uuid() {
		let uuid = 0
		if(typeof localStorage !== 'undefined') {
			uuid = localStorage.uuid
			if(uuid) return uuid
			uuid = localStorage.uuid = this.uuidv4()
			return uuid
		}
		return this.uuidv4()
	}

	///
	/// Build a channel to a service if needed, also forward it contents of this message
	///
	/// Callers typically call this in two scenarios:
	///		1) when they want to specifically message an instance of a service by its uuid
	///		2) when they want to cause to exist a service and then also message it
	///
	/// What does it mean to open a connection to a service?
	///		1) Find or make the service
	///		2) Remember the service if new
	//		3) Run the service if new
	///		4) Return the service
	///
	/// What is a service?
	///		1) Any blob of code that does work
	///		2) Typically loaded dynamically once at least
	///		3) Has an ability to receive messages from here
	///

	async channel(args) {

		// sanity check
		if(!args || !(args.uuid || args.service)) {
			console.error("SERVICES: bad request")
			console.error(args)
			return
		}

		// stuff back channel in
		args._services = this

		// find service
		let service = 0

		// find by uuid
		if(args.uuid) {
			service = this._service_instances[args.uuid]
		}

		// or make new service
		if(!service && args.service) {
			service = await this._load_service(args)
		}

		// cannot find service?
		if(!service) {
			console.error("SERVICES: cannot find service")
			console.error(args)
			return
		}

		// pass the message to the service
		// NOTE doing an await is probably a bad idea - it should not be needed - todo try remove await
		await service.write(args)

		// return the service
		return service
	}

	///
	/// In some cases messages are intended specifically for this manager - not for any other service - handle those here
	///

	async _handle_internal_commands(args) {
		switch(args.command) {
			case 'register':
				this._service_instances[args.use_uuid]=args.service_handle
				break
			default:
				console.error("SERVICES: command not found for inner channel")
				break
		}
	}

	///
	/// Load a service and starts it and returns it
	///
	/// Services are associated with a unique UUID therefore a single service can be 'loaded' more than once.
	///
	/// Generally speaking if a service does not exist this manager attempts to make it exist
	///
	///		+ the assumption is that there is a loadable service at a path specified by the load url path
	///		+ the new service is effectively a separate thread now managed locally
	///		- later verify checksums todo
	///		- later handle remote paths todo
	///		- deal with versioning todo
	///

	async _load_service(args) {

		if(!args.service || !args.service.length) {
			let error = {error:"SERVICES: create: missing service path"} 
			console.error(error)
			console.error(service)
			return 0
		}

		// split the resource locator
		// the notation is domain:path where domain can be * for localhost
		// for now just handle localhost - todo improve

		let parts = args.service.split(':')
		let domain = 0
		let path = parts[parts.length-1]

		// fetch

		try {

			let construct = this._service_canonical[path]

			// a service is always brought up as an instance; but do avoid loading the service class more than once

			if(!construct) {

				let blob = await import("../../"+path+".js")
				if(!blob) {
					console.error("SERVICES: service not found " + path)
					return 0
				}

				// TODO may later handle multiple blobs per file - for now MUST be a new class decl
				construct = blob.default
				if(!(construct instanceof Function)) {
					console.error("SERVICES: illegal class element defined at " + path)
					return 0
				}

				this._service_canonical[path] = construct
			}

			// grant each service instance a unique uuid
			// TODO it would be nice to have this be globally unique - combining a local kernel instance uuid + service id
			// TODO revise idea of user ids for security later - may want to fiddle with this naming

			let owner = args.uid || "root"
			let uuid = owner + path + "/" + this.counter++
			console.log("SERVICES: instancing service name="+args.service+" at uuid="+uuid)

			// instance service - pass it a few args to help including a back channel to this manager

			args.uuid = uuid
			args.owner = owner
			args.service = args.service
			args._services = this

			let service = new construct(args)

			// services need a write method at least
			if(!service.write || !(service.write instanceof Function)) {
				console.error("SERVICES: newly loaded service is missing the send() method " + path)
				return 0
			}

			// remember service
			this._service_instances[uuid] = service

			// return service
			return service

		} catch(err) {
			console.error(err)
			return 0
		}
	}
}

let services = new Services()

window.SERVICES = services

export default services