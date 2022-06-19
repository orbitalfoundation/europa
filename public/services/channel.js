
///
/// Typically a channel creates a bridge between two end points - it is enough of an abstraction to allow me to wire up services
/// In this testbed it is local - but it could also stretch over networks
///

export default class Channel {
	constructor(args={}) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
		this.listeners = []
		if(args.listen) this.listeners = [args.listen]
		console.log(args.listen)
		console.log(args)		
	}
	///
	/// add a listener for local traffic
	/// TODO later have remove listener
	///
	listen(listener) {
		this.listeners.push(listener)
	}
	///
	/// publish to all listeners
	///
	publish(e) {
		console.log(e)
		this.listeners.forEach(listener=>listener.send(e))
	}
	///
	/// send a message to the channel itself - this basically going upstream while publish is going downstream
	///
	send() {
	}
}