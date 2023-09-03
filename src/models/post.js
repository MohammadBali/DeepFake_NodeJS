import mongoose from "mongoose";
import {Inquiry} from "./inquiry.js";

const postSchema= new mongoose.Schema({
    inquiry:{
        type: mongoose.Types.ObjectId,
        required:true,
        ref:'Inquiry',
    },

    owner:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'User',
    },

    likes:[
        {
            owner:{
                type:mongoose.Types.ObjectId,
                required:true,
                ref:'User',
            },
        }],

    comments:[
        {
            comment:{
                type:String,
                cast:true, //Maybe For Audios and Images ???
                required:true,
            },

            owner:{
                type:mongoose.Types.ObjectId,
                required:true,
                ref:'User',
            },
        }
    ],
}, {timestamps:true,});


postSchema.static.LikePost= async function (userID, postID) {
    try
    {
        const p = await Post.findOne(postID);
        if (!p)
        {
            console.log(`No Such post ${postID},  has been found`);
            return null;
        }

        //Find if the user has already liked this post
        for(let e in p.likes)
        {
            if(e.owner === userID)
            {
                p.likes.splice(p.likes.indexOf(e)); //Remove his like

                console.log("User has already Liked this post, removing it...");
                await p.save();
                return p;
            }
        }
        console.log("Adding like to this post");
        p.likes=p.likes.concat({'owner':userID});
        await p.save();
        return p;
    }

    catch (e) {
        console.log(`ERROR WHILE LIKING A POST, ${e}`);
        return false;
    }
};


postSchema.static.AddComment= async function(userID, postID, comment){
    console.log('In Adding a Comment...');

    try
    {
        const p= await Post.find(postID);
        if(!p)
        {
            console.log('No Such Post was Found');
            return null;
        }

        p.comments=p.comments.concat({'comment':comment, 'owner':userID});
        await p.save();
        return p;
    }
    catch (e) {
        console.log(`ERROR WHILE ADDING A COMMENT, ${e}`);
        return false;
    }
};

export const Post= mongoose.model('Post',postSchema);