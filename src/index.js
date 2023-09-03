import express from 'express';
import mongoose from './db/mongoose.js';

import userRouter from './routers/user.js';
import inquiryRouter from './routers/inquiry.js';
import postRouter from "./routers/post.js";

import expressWs from 'express-ws';

const app= express();
const port=3000;

const { app: appWithWs, getWss } = expressWs(app);

app.use(express.json());

app.use(userRouter);

app.use(inquiryRouter);

app.use(postRouter);

//WebSocket Define
appWithWs.ws('/webSocket',function (ws,req){

    console.log('Connected to Web Socket');

    //On Message Received
    ws.on('message',(message)=>
    {
        const parsedMessage = JSON.parse(message);

        console.log(`IN MESSAGE, Received: ${parsedMessage}`);

        ws.send('SomeData');
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});



app.listen(3000,()=>
{
    console.log("Express is Up on port 3000");
});
