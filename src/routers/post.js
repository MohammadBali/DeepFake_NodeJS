import express from "express";
import auth from "../middleware/auth.js";
import {Post} from "../models/post.js";

const router= express.Router();
//Add Post
router.post('/addPost',auth.userAuth, async (req, res)=>{

    try{
        const p= new Post(req.body);

        if(await Post.findOne({'inquiry':req.body.inquiry}) != null )
        {
            return res.status(400).send({'message':'The Same Inquiry has a Post', 'success':0});
        }

        await p.save();
        res.status(201).send({p});

    }
    catch (e) {
        console.log(`ERROR WHILE ADDING NEW POST, ${e}`);
        res.status(500).send({'error':e, 'success':0});
    }
});


//Get All Available Posts, previously used auth.userAuth
router.get('/posts', auth.userAuth, async (req, res)=>{
    console.log('Getting ALl Posts...');

    try
    {
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1
        const limit = parseInt(req.query.limit) || 3; // Number of posts per page, default to 10

        // Calculate the skip value
        const skip = (page - 1) * limit;

        //Criteria, Projection is Null , Options
        const posts=await Post.find({},null,{limit:limit, skip:skip, sort:{createdAt:-1} }).populate(
            {path:'owner',model:'User'} ).populate({path:'inquiry'}).populate(
                {path:'comments', populate:{path:'owner', model:'User', select:{'_id':1, 'name':1, 'photo':1} }});  //{path:'inquiry', populate:{path:'owner',model:'User'} } If to return user Data

        //Calculate the pagination and return it in a Map.
        const pagination= await Post.paginationCalculator(page,limit);

        res.status(200).send({posts,pagination});
    }
    catch (e) {
        console.log(`ERROR WHILE GETTING ALL POSTS IN /getPosts, ${e}`);
        res.status(500).send(e);
    }
});


//Get User's Posts
router.get('/posts/me', auth.userAuth, async(req, res)=>{
    try
    {
        await req.user.populate({
            path:'posts',
            populate:
            [
                {path:'inquiry', model:'Inquiry', populate:{path:'owner',model:'User'}},
                {path:'comments',  populate:{path:'owner', model:'User', select:{'_id':1, 'name':1, 'photo':1} }},
            ],

            options:{
                sort:{createdAt:-1}, //Return Data with the last createdAt (newest first)
            }
        });

        res.status(200).send({posts:req.user.posts});
    }
    catch (e) {
        console.log(`COULD NOT GET USERs POSTS, ${e}`);
        res.status(500).send(e);
    }
});


//Get Posts that a User has Liked
router.get('/likedPosts',auth.userAuth, async (req, res)=>{

    console.log('Getting Posts like by a user through ID');

    try{
        const p= await Post.find({'likes.owner': req.user._id});

        if(!p)
        {
            return res.status(200).send({message:'This User has not liked any posts'});
        }

        res.status(200).send({posts:p});
    }
    catch (e) {
        console.log(`COULD NOT GET POSTS LIKED BY USER, ${e}`);
        res.status(500).send(e);
    }
});

//Delete a Post
router.delete('/deletePost/:id',auth.userAuth,async (req, res) =>
{
    try{
        console.log('In Deleting a Post');
        const id= req.params.id ;

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
router.post('/AddLike',auth.userAuth, async(req, res)=>{
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