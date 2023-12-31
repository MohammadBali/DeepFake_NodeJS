import express from "express";
import {News} from "../models/news.js";

const router= express.Router();


router.get('/getNews', async(req,res)=>{

    try{
        const n= await News.find({},null,{sort: {date:-1}, limit:10 });
        res.status(200).send({articles:n});
    }
    catch (e) {
        console.log(`ERROR WHILE GETTING NEWS, ${e}`);
        res.status(400).send(e);
    }
});

export default router;