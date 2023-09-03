import express from "express";
import {auth} from "../middleware/auth.js";
import {Post} from "../models/post.js";

const router= express.Router();

//Add Post
router.post('/addPost',auth, async (req, res)=>{

    const p= new Post(req.body);

    try{
        if(await Post.findOne({'inquiry':req.body.inquiry}) != null )
        {
            return res.status(400).send({'message':'The Same Inquiry has a Post'});
        }

        await p.save();
        res.status(201).send({p});

    }
    catch (e) {
        console.log(`ERROR WHILE ADDING NEW POST, ${e}`);
        res.status(500).send(e);
    }
});


//Get All Available Posts
router.get('/posts',auth, async (req, res)=>{
    console.log('Getting ALl Posts...');

    try
    {
        const p=await Post.find();

        res.status(200).send(p);
    }
    catch (e) {
        console.log(`ERROR WHILE GETTING ALL POSTS IN /getPosts, ${e}`);
        res.status(500).send(e);
    }
});


//Get User's Posts

router.get('/posts/me', auth, async(req,res)=>{
    try
    {
        await req.user.populate({
            path:'posts',
            sort:{createdAt:-1}, //Return Data with the last createdAt (newest first)
        });

        res.status(200).send({posts:req.user.posts});
    }
    catch (e) {
        console.log(`COULD NOT GET USERs POSTS, ${e}`);
        res.status(500).send(e);
    }
});


//Get Posts that a User has Liked
router.get('/likedPosts',auth, async (req,res)=>{

    console.log('Getting Posts like by a user through ID');

    try{
        const p= await Post.find({'likes.owner': req.user._id});

        if(!p)
        {
            return res.status(200).send({message:'This User has not liked any posts'});
        }

        res.status(200).send(p);
    }
    catch (e) {
        console.log(`COULD NOT GET POSTS LIKED BY USER, ${e}`);
        res.status(500).send(e);
    }
});



router.delete('/deletePost/:id',auth,async (req,res) =>
{
    console.log('In Deleting a Post');
    const id= req.params.id || 1;

    try{
        const p= await Post.findOneAndDelete({_id:id, owner:req.user._id});
        if(!p)
        {
            return res.status(404).send({'message':'No Such Post has been found'});
        }

        res.status(200).send(p);
    }
    catch (e) {
        console.log(`COULDN'T DELETE POST, ${e}`);
        res.status(500).send(e);
    }
});

//Like a Post
router.post('/AddLike',auth, async(req,res)=>{
    console.log('Adding Like to a Post');
    try {

        const p = await Post.findOne({_id:req.body.postID});
        if (!p)
        {
            return res.status(404).send({'message':'No Such post has been found'});
        }

        //If Like already exists =>  remove it.
        // for(let e in p.likes)
        // {
        //     if(e.owner === req.user._id)
        //     {
        //         p.likes.splice(p.likes.indexOf(e));
        //     }
        // }


        p.likes=p.likes.concat({'owner':req.user._id});
        await p.save();

        res.status(200).send(p);

    }
    catch (e) {
        console.log(`COULD NOT LIKE THE POST, ${e}`);

        res.status(500).send(e);
    }
});
export default router;