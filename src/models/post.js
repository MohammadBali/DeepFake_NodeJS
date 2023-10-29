import mongoose from "mongoose";
import {Inquiry} from "./inquiry.js";
import firebase from "../firebase/firebase.js";
import {User} from "./user.js";

const postSchema= new mongoose.Schema({

    title:{
        type:String,
        required:true,
        trim:true
    },

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
        }
        ],

    comments:[
        {
            type:new mongoose.Schema(
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
                },{timestamps:true,},
            ),
        }
    ],
}, {timestamps:true,});


//Send Notification to Post Owner when his post reaches multiples of 10 (Likes or Comments)
postSchema.pre('save',async function (next) {
    const post=this;
    if(post.isModified('likes'))
    {
        //Reached Multiply of 10 => send firebase Message
        if(post.likes.length % 10 ===0 && post.likes.length !==0) //post.likes.length % 10 ===0
        {
            try
            {
                await post.populate('owner');
                const message=firebase.setFirebaseNotificationMessage(
                    post.owner.firebaseTokens, //post.owner.firebaseTokens,
                    `Your Post Got ${post.likes.length} Likes!`,
                    'Check your post now!',
                    {},

                );
                firebase.sendFirebaseNotification(message);
                next();
            }
            catch (e)
            {
                console.log(`ERROR WHILE SENDING FIREBASE MESSAGE IN POST-SCHEMA.PRE(SAVE), ${e}`);
                next();
            }
        }
    }

    if(post.isModified('comments'))
    {
        //Reached Multiply of 10 => send firebase Message
        if(post.comments.length % 10 ===0 && post.comments.length !==0) //post.comments.length % 10 ===0
        {
            try
            {
                await post.populate('owner');
                const message=firebase.setFirebaseNotificationMessage(
                    post.owner.firebaseTokens, //post.owner.firebaseTokens,
                    `Your Post Got ${post.comments.length} comments!`,
                    'Check your post now!',
                    {},

                );
                firebase.sendFirebaseNotification(message);
                next();
            }
            catch (e)
            {
                console.log(`ERROR WHILE SENDING FIREBASE MESSAGE IN POST-SCHEMA.PRE(SAVE), ${e}`);
                next();
            }
        }
    }
});


//After saving the post, will check for all the users who are subscribed to this post owner and notify them about the new post
postSchema.post('save', async function(doc,next){

    //Check if the post is new
    if(true) //doc.isNew
    {
        try
        {
            await doc.populate('owner');

            const users= await User.find({'subscriptions.owner_id':doc.owner._id});

            if(!users)
            {
                console.log(`No Users are subscribed to this user (${doc.owner._id}) content`);
                next();
            }

            else
            {
                for (let user of users)
                {
                    if(user.firebaseTokens != null)
                    {
                        console.log(`FirebaseToken is ${user.firebaseTokens}`);
                        const message=firebase.setFirebaseNotificationMessage(
                            user.firebaseTokens,
                            `${doc.owner.name} ${doc.owner.last_name} has shared a new post!`,
                            `"${doc.title}", Check it now`,
                            {
                                'post_id':`${doc._id}`,
                            },

                        );
                        firebase.sendFirebaseNotification(message);
                    }
                }

                next();
            }
        }
        catch (e) {
            console.log(`ERROR WHILE POST_SAVE IN POST, ${e.toString()}`);
            next();
        }
    }

    else
    {
        console.log('NOT NEW');

        next();
    }
});

//Calculate the Pagination and return the data
postSchema.statics.paginationCalculator= async function (page,limit)
{
    // Count the total number of posts
    const totalCount = await Post.countDocuments();

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalCount / limit);

    // Build pagination links
    const pagination = {
        currentPage: page,
        totalPages,
    };

    if (page < totalPages) {
        pagination.nextPage = `?page=${page + 1}&limit=${limit}`;  //  /posts?page=${page + 1}&limit=${limit}
    }

    if (page > 1) {
        pagination.prevPage = `?page=${page - 1}&limit=${limit}`; // /posts?page=${page - 1}&limit=${limit}
    }

    return pagination;
}

export const Post= mongoose.model('Post',postSchema);




// DOES NOT WORK BECAUSE DATABASE IS NOT CLUSTERED...


// //Listen to changes on Posts, if any change occurs on the likes => will send firebase message
// const postChangeStream = Post.watch();
// postChangeStream.on('change',async (event)=>
// {
//     console.log('CHANGE IN LIKES');
//     if(event.updateDescription.updatedFields.likes && event.updateDescription.updatedFields)
//     {
//         console.log('CHANGE IN LIKES');
//         const p=await Post.findById(event.documentKey._id);
//
//         console.log(`Post ID: ${p._id}, Owner ID:${p.owner}`);
//     }
// });
//
//
