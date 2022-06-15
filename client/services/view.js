
///
/// View is performing several roles:
///
/// + It "pretends" to be a rust/wasm service that is only accessible over a socket or message channel - ie: an asynchronous arms length relationship.
///
/// + It receives commands or requests with a 'load' of a scene graph - this will be painted or updated persistently to a display. This is the key role.
///
/// + The design intent is that important events such as mouse movement or touch events can be piped back to a caller if they specify an event return channel.
///
/// + If this is written well, it should be swappable for a native rust/wasm or other rasterizer and event handler.
///
///


export default class View {

	constructor(args) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
		this.nodes = []
		this.listeners = []
		if(args.listen) this.listeners = [args.listen]
		console.log(args.listen)
		console.log(args)
	}

	async send(args) {
		let c = args && args.command ? args.command : "load"
		switch(c) {
			case "load":
				if(args.load) {
					this.fragment_recurse(args.load)
				}
				break
			default:
				console.error("View: not valid command=" + c)
				console.error(args)
				break
		}
	}

	listen(listener) {
		this.listeners.push(listener)
	}

	publish(e) {
		this.listeners.forEach(listener=>listener.send(e))
	}

	fragment_recurse(fragment) {

		if(!fragment || !fragment.uuid) {
			console.error("view: bad fragment")
			console.log(fragment)
			return
		}

		// don't pass the children portion of the graph - just pass one node
		let children = fragment.children
		delete fragment.children

		// inject this service so i can send messages and so on
		fragment._view = this

		// render the one node
		babylon_sdl(fragment)

		// visit children one by one - always set parent
		if(children) {
			children.forEach(child=>{
				child.parent_uuid = fragment.uuid
				this.fragment_recurse(child)
			})
		}

		// undamage
		fragment.children = children

		// remember fragments
		this.nodes[fragment.uuid]=fragment
	}
}

/*

///
/// ViewFactory
///

export default class ViewFactory {

	constructor(args) {
		// the caller (typically pool) MUST supply a poolchannel for any traffic this service wishes to send to anybody else
		this.poolchannel = args.poolchannel
		// the caller (typically pool) MUST specify where it would like this service to be mounted
		this.uuid = args.uuid || args.service
		this.mountcounter = 0
	}

	async channel(args) {

		// if no command is specified then assume that the caller intention is to spin up a new view parser
		let c = args && args.view_command ? args.view_command : "create"

		switch(c) {
			case "create":
				// instance a copy of the view parser
				await this._create(args)
				break
			default:
				// unknown command - no other commands are handled yet
				console.error({error:"ViewFactory: unknown command "})
				console.error(args)
				return {error:"ViewFactory: unknown command"}
		}

	}

	///
	/// spin up a new instance of view - and forward the traffic onwards
	///

	async _create(args) {

		// make a mount point - this should always be in a portion of the namespace that this service area controls
		this.mountcounter++
		args.uuid = this.uuid + "/" + this.mountcounter

		// make a view instance and pass it whatever the command was initially 
		let instance = new View(args)
		let channel = instance.channel.bind(instance)

		// register the service channel
		this.poolchannel({uuid:"pool",command:"register",use_uuid:args.uuid,channel:channel})

		// pass the command onwards again - this is the better place to handle the command than in the constructor
		instance.channel(args)
	}
}
*/


