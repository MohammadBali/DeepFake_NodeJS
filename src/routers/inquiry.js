import express from "express";
import auth from "../middleware/auth.js";
import {Inquiry} from "../models/inquiry.js";

const router= express.Router();

//Add a Text Inquiry, expecting an image which keyword name is 'text'
router.post('/addTextInquiry',auth.userAuth, auth.textAuth.single('text'),async (req, res)=>{

    console.log('Getting Text Data');

    try{
        const textBuffer= req.file.buffer.toString('base64');

        const inquiry= new Inquiry({
            name:req.body.name,
            type:req.body.type,
            data:textBuffer, //Data is String
            owner:req.user._id,
            result:req.body.result,
        });
        await inquiry.save();


        res.status(201).send({
            inquiry:
                {
                    name:inquiry.name,
                    type:inquiry.type,
                    owner:inquiry.owner,
                    _id:inquiry._id,
                    result:inquiry.result,
                    createdAt:inquiry.createdAt,
                    updatedAt:inquiry.updatedAt,
                    data:inquiry.data,
                },
        });
    }

    catch (e) {
        console.log(`Could not Add Inquiry, ${e}`);
        res.status(500).send(e);
    }
}, (error, req, res, next)=> {
    res.status(400).send({error: error.message});
});

//Add an Image Inquiry, expecting an image which keyword name is 'image'
router.post('/addImageInquiry',auth.userAuth, auth.imageAuth.single('image'), async (req, res)=>{

    try{
        const imageBuffer= req.file.buffer;

        const inquiry= new Inquiry({
            name:req.body.name,
            type:req.body.type,
            data:imageBuffer, //Data is ImageBuffer
            owner:req.user._id,
            result:req.body.result,
        });

        await inquiry.save();

        res.status(201).send({inquiry});
    }
    catch (e) {
        console.log(`Could not Add Image Inquiry, ${e}`);
        res.status(500).send(e);
    }
}, (error, req, res, next)=>
{
    res.status(400).send({error:error.message}); //Error Handler for Multer too.
});


//Add an Image Audio, expecting an image which keyword name is 'image'
router.post('/addAudioInquiry',auth.userAuth, auth.audioAuth.single('audio'), async (req, res)=>{


    try{
        const audioBuffer= req.file.buffer;
        const inquiry= new Inquiry({
            name:req.body.name,
            type:req.body.type,
            data:audioBuffer, //Data is ImageBuffer
            owner:req.user._id,
            result:req.body.result,
        });

        await inquiry.save();

        res.status(201).send({inquiry});
    }
    catch (e) {
        console.log(`Could not Add Audio Inquiry, ${e}`);
        res.status(500).send(e);
    }
}, (error, req, res, next)=> {
    res.status(400).send({error: error.message});
});



//Send All Inquiries in Database
router.get('/inquiries',async (req,res)=>{
    try
    {
        const q= await Inquiry.find();
        res.status(200).send({inquiries:q});
    }
    catch (e) {
        res.status(500).send(e);
    }
});

//Get User's Inquiries
router.get('/inquiries/me',auth.userAuth, async (req, res)=>{
    console.log('in Sending User\'s inquiries ');
    try{
        await req.user.populate({
            path:'inquiries',
            options:{
                sort:{createdAt:-1}, //Return Data with the last createdAt (newest first)
            },

        });

        res.status(200).send({inquiries:req.user.inquiries});
    }
    catch (e) {
        console.log("error in Sending User's inquiries, " + e);
        res.status(500).send(e);
    }
});


//Delete an Inquiry
router.delete('/inquiries/delete/:id',auth.userAuth,async (req, res)=>{

    let gid;
    try{
        const id= req.params.id;
        gid=id;
        const inquiry= await Inquiry.findOneAndDelete({_id:id, owner:req.user._id});
        if(!inquiry)
        {
            console.log(`No Such inquiry with ID ${id} for this user ${req.user._id}`);
            res.status(404).send({error:`No Such inquiry with ID ${id} for this user ${req.user._id}`});
        }
        res.send(inquiry);
    }
    catch (e) {
        console.log(`Could not delete the inquiry with ID: ${gid}, ERROR : ${e}`);
        res.status(500).send(e);
    }
});
export default router;