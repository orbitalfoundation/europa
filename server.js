
/////////////////////////////////////////////////////////////////
/// db 
///
/// stores hashes
/// hash space is overloaded - some terms are reserved
///
///		offset
///		limit
///		event
///		orderby
///
/// some fields get special treatment
///
///		uuid
///
/////////////////////////////////////////////////////////////////

let db_indexed = {}
let db_created = {}
let db_updated = {}

const onewayCompare = (obj1, obj2) => Object.keys(obj1).every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key] )

///
/// merge changes into database and notify if changes occurred
///
/// - TODO right now the indexes are hardcoded allow more kinds of indexing schemes not just on uuid
/// - TODO fancier merge rules?
/// - TODO fancy ACL rules per obj?
///

function db_merge(changes) {
	// must be valid change list
	let uuid = changes ? changes.uuid : 0
	if(!uuid) return 0
	// must have contributed some change to the global state
	let prev = db_indexed[uuid]
	if(prev && onewayCompare(changes,prev)) return 0
	// set created and updated
	db_updated[uuid]=Date.now()
	if(!db_created[uuid]) db_created[uuid]=db_updated[uuid]
	// do a merge
	let merged = db_indexed[uuid] = { ...(prev?prev:{}),...changes}
	// return whole set
	return merged
}

///
/// A query may be one hash to match or an array of hashes to match
/// If an uuid is passed then always ONLY matches on that UUID
/// Results are always returned as an array
///

function db_query(queries) {
	let results = []
	if(queries) {
		if(!Array.isArray(queries)) queries = [queries]
		queries.forEach(match=>{
			delete match.offset
			delete match.limit
			delete match.event
			delete match.orderby
			console.log(match)
			data.forEach(item=>{
				let success = true
				for (const [k,v] of Object.entries(match)) {
					if(item[k] != v) {
						success = false;
						break;
					}
				}
				if(success) {
					results.push(item)
				}
			})
		})
	}
	return results
}

///
/// given a set of queries on objects - return the children of them as an array
///
/* tbd may not support
function db_query_children(queries) {
	let parents = db_query(queries)
	parents.forEach(item=>{
		// may enumerate children as an array of explicitly named candidates
		if(item.children && Array.isArray(item.children)) {
			item.children.forEach(slug=>{
				data.forEach(item2=>{
					if(item2.slug == slug) results.push(item2)
				})
			})
			return
		}
		// or children indicate parent by name
		let query = item.children
		data.forEach(item=>{
			Object.keys(query).forEach(key=>{
				if(item[key] == query[key]) children.push(item)
			})
		})
	})

}
*/

////////////////////////////////////////////////////////////
// express js
////////////////////////////////////////////////////////////

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import path from 'path'
import express from 'express'
import http from 'http'

let static_files = path.join(__dirname, './public')

const app = express()
app.use(express.json());
const httpserver = http.createServer(app)

app.use(express.static(static_files))
app.get('/', (req, res) => {
	res.sendFile(static_files + '/index.html');
})

app.use(function(err, req, res, next) {
	console.log(err)
	next(err)
})

app.post('/query',(req,res) => {
	let results = db_query(req.body)
	res.status(200).json(results)
})

app.get('/observe',(req,res) => {
	res.status(200).json({ success: "good " })
})

/////////////////////////////////////////////////////////////////
// web sockets for observables
/////////////////////////////////////////////////////////////////

import { Server } from "socket.io"
const io = new Server(httpserver)

io.on('connection', (socket) => {
	// - send graph on new connections - todo

	socket.on('data', (args) => {

		// request to start observing based on some query? later filter better TODO
		if(args.observe) {
			console.log("net: request to observe")
			socket.emit("data",{load:Object.values(db_indexed)})
		}

		// request to push some state to all sockets except the emitter
		if(args.load) {
			console.log("net: request to load")
			if(!Array.isArray(args.load)) {
				console.error("server: only accepts arrays of objects")
				console.error(args)
				return
			}
			let changes = []
			args.load.forEach((item)=>{
				if(db_merge(item)) {
					console.log("net: merged " + item.uuid)
					changes.push(item)
				}
			})
			if(changes.length) {
				socket.broadcast.emit("data",{load:changes})
			}
		}
	})

	// do something with disconnects i guess
	socket.on('disconnect', () => {
		console.log('Server: user disconnected')
	})
})

/////////////////////////////////////////////////////////////////
// start express and websockets together
/////////////////////////////////////////////////////////////////

const port = parseInt(process.env.PORT) || 8080;
httpserver.listen(port, () => {
	console.log('server is listening')
})

/*

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

app.listen(port, () => {
  console.log(`helloworld: listening on port ${port}`);
});

*/
