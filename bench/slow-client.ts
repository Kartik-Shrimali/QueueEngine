import 'dotenv/config'
import { connect } from 'node:net'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
    console.error("Please provide admin api key");
    process.exit(1);
}

const socket = connect({ port: 3000, host: "127.0.0.1" }, () => {
    socket.write(`GET /ws?key=${ADMIN_API_KEY} HTTP/1.1\r\nHost: localhost:3000\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n`)
    
    socket.pause();
    console.log(`socket connected,not reading`);
})


socket.on('close', () => {
    console.log("Socket is closing")
})

socket.on('error', (error: any) => {
    console.log("There was some error in socket.Error Message: ", error.message);
})

setInterval(() => {} , 1000);