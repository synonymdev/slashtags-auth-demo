import jrpcLite from 'jsonrpc-lite';
import { fastify } from 'fastify';
import JsonRPC from 'simple-jsonrpc-js';
import {WebSocketServer} from 'ws'
import fs from 'fs'

import SDK, { SlashURL } from '@synonymdev/slashtags-sdk';
import { Server } from '@synonymdev/slashtags-auth';

/** START SLASHTAGS AUTH SETUP **/

let saved 
try { saved = fs.readFileSync('./storage/primaryKey') } catch {}

const sdk = new SDK({ storage: './storage', primaryKey: saved })

if (!saved) fs.writeFileSync('./storage/primaryKey', sdk.primaryKey)

// Get the default slashtag
const slashtag = sdk.slashtag()

// Set profile if not already saved
const publicDrive = slashtag.drivestore.get()
await publicDrive.ready()
const exists = await publicDrive.get('/profile.json')
if (!exists) await publicDrive.put('/profile.json', Buffer.from(JSON.stringify({
  name: 'Slashtags Demo',
  image:
    "data:image/svg+xml,%3Csvg viewBox='0 0 140 140' id='svg-slashtags' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M59.469 48.981h13.074l-11.29 41.947H48.18l11.29-41.947zm32.352 0l-11.29 41.947H67.456l11.29-41.947h13.075z' fill='%23fff'%3E%3C/path%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M75.578 17.299c29.14 3.079 50.202 29.184 47.123 58.279-3.079 29.14-29.184 50.202-58.279 47.123-29.14-3.079-50.202-29.184-47.123-58.279 3.079-29.14 29.184-50.202 58.279-47.123zm-1.16 11.067C51.526 25.91 30.775 42.69 28.366 65.582c-2.455 22.892 14.324 43.643 37.216 46.052 22.892 2.455 43.643-14.324 46.052-37.216 2.455-22.892-14.324-43.643-37.216-46.052z' fill='red'%3E%3C/path%3E%3C/svg%3E",
  bio: 'Web of trust for all',
})))

const server = new Server(slashtag, {
    onauthz: (token, remote) => {
      if (!isValidUser(remote)) return { status: "error", message: "sign up first!"}

      const url = SlashURL.format(remote)

      // Check that token is valid, and remote isn't blocked
      const valid = validateToken(token, url)
      if (valid) {
        console.log('Got valid session', token, "from:", url);
        return { status: "ok" }
      }
      console.log('Got invalid session', token, "from:", url);
      return {status: "error", message: "invalid token"}
    }
})

// Listen on server's Slashtag key through DHT connections
await slashtag.listen()

/** END OF SLASHTAGS AUTH SETUP **/

/** YOUR NORMAL SERVER LOGIC **/
const sessions = new Map();

function isValidUser(_) { return true }

function validateToken(token, user) {
  const socket = sessions.get(token);
  if (!socket) return false
  socket.send(
    jrpcLite
    .notification('userAuthenticated', {user})
    .serialize(),
  );
  return true
}

const app = fastify();

const wss = new WebSocketServer({ port: 9002 });

wss.on('connection', (socket) => {
  const jrpc = new JsonRPC();

  socket.onmessage = (event) => jrpc.messageHandler(event.data);
  jrpc.toStream = (msg) => socket.send(msg);

  jrpc.on('clientID', ['clientID'], (clientID) => {
    const saved = sessions.get(clientID);
    if (saved === socket) return
    saved?.close();

    sessions.set(clientID, socket);
    console.log('Client connected: ', clientID);
    console.log('Sessions: ', sessions.size);

    jrpc.notification('slashauthUrl', {
      url: server.formatURL(clientID)
    });
  });
});

console.log(`Server is now listenng on port 9002`);
app.listen(9000, function () {});
