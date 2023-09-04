import express from 'express';
import mongoose from './db/mongoose.js';

import userRouter from './routers/user.js';
import inquiryRouter from './routers/inquiry.js';
import postRouter from "./routers/post.js";

import expressWs from 'express-ws';
import components from './shared/components.js';
import {Post} from "./models/post.js";

const app= express();
const port=3000;

const expressWebSocket = expressWs(app);
const wsApp= expressWebSocket.app;

app.use(express.json());

app.use(userRouter);

app.use(inquiryRouter);

app.use(postRouter);


//Get the WebSocket info
let socketManager=expressWebSocket.getWss('/webSocket');
wsApp.ws('/webSocket',function (ws){ //was (ws,req).

    console.log(`Client has Connected to Web Socket`);

    //On Message Received
    ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message);

        //console.log(`IN MESSAGE, Received: ${message}`);

        const data = await components.analyseMessageType(parsedMessage);

        //Data returned is Post => Pass it to client
        if (data instanceof Post) {
            if (parsedMessage.type === 'comment') {
                socketManager.clients.forEach(function (client) {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify({data:data, type:'Add_Comment'})); // we can write {type:'comment', data:data} then stringify it ??
                    }
                });
            }

            if (parsedMessage.type === 'like') {
                socketManager.clients.forEach(function (client) {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify({data:data, type:'Like'})); // we can write {type:'like', data:data} then stringify it ??
                    }
                });
            }

            if (parsedMessage.type === 'deleteComment') {
                socketManager.clients.forEach(function (client) {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify({data:data, type:'Delete_Comment'})); // we can write {type:'like', data:data} then stringify it ??
                    }
                });
            }
        }

        //Data Returned is -1 or -2 => No Post has been found and ONLY SEND IT TO THE CLIENT WHO SEND THE REQUEST => client===ws
        else if (Number.isInteger(data)) {
            socketManager.clients.forEach(function (client) {
                if (client===ws && client.readyState === ws.OPEN) {
                    client.send(JSON.stringify(data === -1 ? {error: 'Error ', message: 'No Such Post has been found'} : {error: 'Error ', message: 'Wrong Type'}));
                }
            });
        }

        //Not Post or Number => Error and ONLY SEND IT TO THE CLIENT WHO SEND THE REQUEST => client===ws
        else {
            socketManager.clients.forEach(function (client) {
                if (client===ws && client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({error: 'Error While Processing data', message: data}));
                }
            });
        }


    });

    ws.on('close', () => {
        console.log(`Client disconnected`);
    });
});


app.listen(port,()=>
{
    console.log("Express is Up on port 3000");
});
