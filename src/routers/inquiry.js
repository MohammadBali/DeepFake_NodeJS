import express from "express";
import {auth} from "../middleware/auth.js";
import {Inquiry} from "../models/inquiry.js";

const router= express.Router();

//Add an Inquiry
router.post('/addInquiry',async (req, res)=>{
    const inquiry= new Inquiry(req.body);

    try{
        await inquiry.save();

        res.status(201).send({inquiry});
    }
    catch (e) {
        console.log(`Could not Add Inquiry, ${e}`);
        res.status(500).send(e);
    }
});


//Send All Inquiries in Database
router.get('/inquiries',async (req,res)=>{
    try
    {
        const q= await Inquiry.find();
        res.status(200).send(q);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

//Get User's Inquiries
router.get('/inquiries/me',auth, async (req,res)=>{
    console.log('in Sending User\'s inquiries ');
    try{
        await req.user.populate({
            path:'inquiries',
            sort:{createdAt:-1}, //Return Data with the last createdAt (newest first)
        });

        res.status(200).send({inquiries:req.user.inquiries});
    }
    catch (e) {
        console.log("error in Sending User's inquiries, " + e);
        res.status(500).send(e);
    }
});


//Delete an Inquiry
router.delete('inquiries/delete/:id',auth,async (req,res)=>{
    const id= req.params.id;
    try{
        const inquiry= await Inquiry.findOneAndDelete({_id:id, owner:req.user._id});
        if(!inquiry)
        {
            console.log(`No Such inquiry with ID ${id} for this user ${req.user._id}`);
            res.status(404).send({error:`No Such inquiry with ID ${id} for this user ${req.user._id}`});
        }
        res.send(inquiry);
    }
    catch (e) {
        console.log(`Could not delete the inquiry with ID: ${id}, ERROR : ${e}`);
        res.status(500).send(e);
    }
});
export default router;