import express from 'express';
import mongoose from './db/mongoose.js';
import userRouter from './routers/user.js';
import inquiryRouter from './routers/inquiry.js';

const app= express();
const port=3000;

app.use(express.json());

app.use(userRouter);

app.use(inquiryRouter);

app.listen(3000,()=>
{
    console.log("Express is Up on port 3000");
});