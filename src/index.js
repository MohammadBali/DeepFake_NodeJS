import express from 'express';
import mongoose from './db/mongoose.js';

import userRouter from './routers/user.js';
import inquiryRouter from './routers/inquiry.js';
import postRouter from "./routers/post.js";
import newsRouter from "./routers/news.js";

import expressWs from 'express-ws';
import components from './shared/components.js';
import {Post} from "./models/post.js";

import timedEvents from "./shared/timedEvents.js";  //Get News Daily

const app= express();
const port=3000;

const expressWebSocket = expressWs(app);
const wsApp= expressWebSocket.app;

app.use(express.json());

app.use(userRouter);

app.use(inquiryRouter);

app.use(postRouter);

app.use(newsRouter);


//Get the WebSocket info
let socketManager=expressWebSocket.getWss('/webSocket');
wsApp.ws('/webSocket',function (ws){ //was (ws,req).

    console.log(`Client has Connected to Web Socket`);
    //On Message Received
    ws.on('message', async (message) =>
    {
        try
        {
            //const parsedMessage = JSON.parse(message);
            console.log(`Current message is ${message}`);
            const parsedMessage=message;
            //Check if user is authenticated.
            if(await components.wsAuth(parsedMessage))
            {
                //console.log(`IN MESSAGE, Received: ${message}`);

                //Will Check for the message type and do the required operations for it and return the results.
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
                                client.send(JSON.stringify({data:data, type:'Like'}));
                            }
                        });
                    }

                    if (parsedMessage.type === 'deleteComment') {
                        socketManager.clients.forEach(function (client) {
                            if (client.readyState === ws.OPEN) {
                                client.send(JSON.stringify({data:data, type:'Delete_Comment'}));
                            }
                        });
                    }


                    if (parsedMessage.type === 'deletePost') {
                        socketManager.clients.forEach(function (client) {
                            if (client.readyState === ws.OPEN) {
                                client.send(JSON.stringify({data:data, type:'Delete_Post'}));
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
            }

            else
            {
                socketManager.clients.forEach(function (client) {
                    if (client===ws && client.readyState === ws.OPEN) {
                        client.send(JSON.stringify({error: 'Error While Authenticating', message: 'Not Authorized'}));
                    }
                });
            }
        }
        catch (e) {
            console.error('WebSocket Error:', e);

            // Handle the error or send an error response to the client if needed.
            // For example:
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ error: 'Error in WebSocket communication', message: e.message }));
            }
        }

    });

    ws.on('close', () => {
        console.log(`Client disconnected`);
    });
});



app.listen(port,()=>
{
    console.log(`Express is Up on port ${port}`);
});
