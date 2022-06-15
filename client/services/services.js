
///
/// Service Manager
///
/// This is a kernel service that itself handles messaging and creation and management of (other) services.
///
/// What is a service?
///
/// 	+ A service is a wrapper for some functionality - it is a message end point that does some async work on demand
/// 	+ From a callers perspective a service is a thing that can handle messages in some useful way (a service does some work).
/// 	+ From the perspective of this code, the job is to route messages to the right service, and/or create & run that service.
/// 	+ Services are asynchronous - there is no function call style suspension of the sender.
///

export default class Services {

	constructor(args=0) {
		this.counter = 0
		this._service_instances = { "services": this }
		if(args)this.send(args)
	}

	///
	/// Send Channel traffic
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

	async send(args) {

		// sanity check
		if(!args || !(args.uuid || args.service)) {
			console.error("SERVICES: bad request")
			console.error(args)
			return
		}

		// inject a back channel to this service manager as a convenience - _services is a reserved keyword therefore
		args._services = this

		// find service
		let service = 0

		// find by uuid
		if(args.uuid) {
			service = this._service_instances[args.uuid]
		}

		// or make new service - todo arguably the uuid could set a service path as an option? ponder more
		if(!service && args.service) {
			service = await this._load_service(args)
		}

		// cannot find service?
		if(!service) {
			console.error("SERVICES: cannot find service = " + path)
			console.error(args)
			return
		}

		// pass the message to the service
		// NOTE doing an await is probably a bad idea - it should not be needed - todo try remove await
		await service.send(args)

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
	/// Load a service and return it
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

		// reject remote urls for now - todo allow remote urls later
		if(!args.service || !args.service.startsWith("localhost:")) {
			let error = {error:"SERVICES: create: bad request remote urls not supported"} 
			console.error(error)
			console.error(service)
			return 0
		}

		try {

			// fetch handler from wherever it is on the internet
			//console.log("SERVICES: loading class off disk service named " + args.service)
			let path = "../.."+args.service.substring("localhost:".length)+".js"
			let blob = await import(path)
			if(!blob) {
				console.error("SERVICES: service not found " + path)
				return 0
			}

			// TODO may later handle multiple blobs per file - for now MUST be a new class decl
			let construct = blob.default
			if(!(construct instanceof Function)) {
				console.error("SERVICES: illegal class element defined at " + path)
				return 0
			}

			// TODO revise idea of user ids for security later
			let owner = args.uid || "root"
			let uuid = owner + "/" + args.service + "/" + this.counter++
			console.log("SERVICES: instancing service name="+args.service+" at uuid="+uuid)

			// instance service - pass it a few args to help including a back channel to this manager

			args.uuid = uuid
			args.owner = owner
			args.service = args.service
			args._services = this

			let service = new construct(args)

			// services need a send method at least
			if(!service.send || !(service.send instanceof Function)) {
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