import express from "express";
import auth from "../middleware/auth.js";
import {Inquiry} from "../models/inquiry.js";
import components from "../shared/components.js";
const router= express.Router();

//Add a Text Inquiry, expecting a text file
router.post('/addTextInquiry',auth.userAuth, auth.textAuth.single('text'),async (req, res)=>{

    console.log('Getting Text Data');

    try
    {
        const textBuffer= req.file.buffer.toString('base64');

        //const modelResult = await components.sendInquiryToModel(req.file.buffer.toString()); //Send File to AI Model and get the results back

        const modelResult = await components.sendInquiryFileToModel(req.file); //Send File to AI Model and get the results back

        if(modelResult ==null)
        {
            console.log(`Model Result is empty, ${modelResult}`);

            return res.status(400).send({error:'Model result was empty'});
        }

        const inquiry= new Inquiry({
            name:req.body.name,
            type:req.body.type,
            data:textBuffer, //Data is base64 String
            owner:req.user._id,
            result:modelResult['predicted_class'] === "machine generated" ? 'fake' : 'real', //Different word usage for storing if it's fake or not
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
        console.log(`Could not Add Inquiry, ${e.stack}`);
        res.status(500).send(e);
    }
}, (error, req, res, next)=> {
    res.status(400).send({error: error.message});
});

//Add an Audio Inquiry, expecting an audio file
router.post('/addAudioInquiry',auth.userAuth, auth.audioAuth.single('audio'), async (req, res)=>{

    console.log('Getting Audio Data');
    try{
        const audioBuffer= req.file.buffer.toString('base64');

        // const modelResult = await components.sendAudioFileToModel(req.file); //Send Audio File to AI Model and get the results back
        //
        // if(modelResult ==null)
        // {
        //     console.log(`Audio Model Result is empty, ${modelResult}`);
        //
        //     return res.status(400).send({error:'Model result was empty'});
        // }


        const inquiry= new Inquiry({
            name:req.body.name,
            type:req.body.type,
            data:audioBuffer, //Data is base64 String
            owner:req.user._id,
            result:req.body.result,
            //result:modelResult['predicted_class'] === "machine generated" ? 'fake' : 'real', //Different word usage for storing if it's fake or not
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
        console.log(`Could not Add Audio Inquiry, ${e}`);
        res.status(500).send(e);
    }
}, (error, req, res, next)=> {
    res.status(400).send({error: error.message});
});

//Add an Image Inquiry, expecting an image file
router.post('/addImageInquiry',auth.userAuth, auth.imageAuth.single('image'), async (req, res)=>{

    console.log('Getting Image Data');
    try{
        const imageBuffer= req.file.buffer.toString('base64');

        // const modelResult = await components.sendImageFileToModel(req.file); //Send Audio File to AI Model and get the results back
        //
        // if(modelResult ==null)
        // {
        //     console.log(`Image Model Result is empty, ${modelResult}`);
        //
        //     return res.status(400).send({error:'Image Model result was empty'});
        // }


        const inquiry= new Inquiry({
            name:req.body.name,
            type:req.body.type,
            data:imageBuffer, //Data is base64 String
            owner:req.user._id,
            result:req.body.result,
            //result:modelResult['predicted_class'] === "machine generated" ? 'fake' : 'real', //Different word usage for storing if it's fake or not
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
        console.log(`Could not Add Image Inquiry, ${e}`);
        res.status(500).send(e);
    }
}, (error, req, res, next)=>
{
    res.status(400).send({error:error.message}); //Error Handler for Multer too.
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