import {Post} from "../models/post.js";
import jwt from "jsonwebtoken";
import constants from "./constants.js";
import {User} from "../models/user.js";
import {News} from "../models/news.js";
import axios from "axios";
import FormData from "form-data";

//HANDLING REAL_TIME CONNECTIONS USING WEBSOCKETS.
async function analyseMessageType(message)
{
    if(message.type === 'like')
    {
        return await AddLike({userID:message.userID, postID:message.postID});
    }

    if(message.type === 'deleteComment')
    {
        return await deleteComment({commentID:message.commentID, postID:message.postID});
    }

    if(message.type === 'comment')
    {
        return await AddComment({userID:message.userID, postID:message.postID, comment:message.comment});
    }

    if(message.type === 'deletePost')
    {
        return await deletePost({postID:message.postID, userID:message.userID});
    }

    return -2;
}

//-------------------------------------------------

//Add a Like to a Post
async function AddLike({userID, postID})
{
    console.log(`Modifying a Like to a Post in Components, userID is:${userID}, postID is: ${postID}`);

    try {
        const p = await Post.findOne({_id: postID}).populate('owner').populate('inquiry').populate(
            {
                path: 'comments',
                populate: {path: 'owner', model: 'User', select: {'_id': 1, 'name': 1, 'photo': 1, 'last_name': 1}}
            },
        );
        if (!p) {
            console.log('No Post has been found');
            return -1;
        }

        //let elementIndex = -1;

        let elementIndexList=[];

        //If Like already exists =>  remove it.
        for (const e of p.likes) {
            if (e.owner.toString() === userID) {

                //elementIndex=p.likes.indexOf(e);

                console.log(`Found User to remove his like, like id is: ${e._id}`);

                elementIndexList.push(e); //add the element index to the list to be removed later on
                break;
            }
        }

        //User Has Liked that post => Remove it and return posts.
        if(elementIndexList.length >0)
        {
            for(const element of elementIndexList)
            {
                //p.likes.splice(p.likes[element],1);

                p.likes = p.likes.filter(item => !elementIndexList.includes(item) );
            }

            await p.save();
            return p;
        }

        // if (elementIndex !== -1)
        // {
        //     console.log('User has already liked this post, unliking it now...');
        //     p.likes.splice(p.likes[elementIndex],1);
        //     await p.save();
        //
        //     return p;
        // }

        else
        {
            //Like doesn't already exist => Add it and save then pass the Post p
            p.likes=p.likes.concat({owner:userID});
            await p.save();

            return p;
        }
    }

    catch (e) {
        console.log(`ERROR WHILE ADDING A LIKE, ${e}`);
        return e;
    }
}

//Add a Comment to a Post, will return -1 if no Post is Found, will return Post if operation is done successfully, otherwise will return error
async function AddComment({userID, postID, comment})
{
    console.log('Adding a Comment to a Post in Components');

    try{
        const p= await Post.findOne({_id:postID});
        if(!p)
        {
            console.log("No Such Post to add a comment to it");
            return -1;
        }

        p.comments=p.comments.concat({comment, owner:userID});
        await p.save();

        return await Post.findOne({_id: postID}).populate('owner').populate('inquiry').populate(
            {
                path: 'comments',
                populate: {path: 'owner', model: 'User', select: {'_id': 1, 'name': 1, 'photo': 1, 'last_name': 1}}
            },
        );
    }
    catch (e) {
        console.log(`ERROR WHILE ADDING A COMMENT, ${e}`);
        return e;
    }
}

//Delete a Comment
async function deleteComment({commentID, postID})
{
    console.log(`in Deleting a Comment in Components, CommentID:${commentID}, postID:${postID}`);

    try
    {
        const p= await Post.findOne({_id:postID}).populate('owner').populate('inquiry').populate(
            {path:'comments',  populate:{path:'owner', model:'User', select:{'_id':1, 'name':1, 'photo':1, 'last_name':1} }},
        );

        if(!p)
        {
            console.log("No Such Post found with this commentID");
            return -1;
        }


        let elementIndexList;

        for(const e of p.comments)
        {
            if(e._id.toString() === commentID)
            {
                console.log(`COMMENT ID TO BE DELETED: ${e._id}`);
                //elementIndexList.push(e); //add the element index to the list to be removed later on

                elementIndexList=e;

                break;
            }
        }

        if(elementIndexList!==null)
        {
            p.comments = p.comments.filter(item => elementIndexList !==item );

            await p.save();
            return p;
        }

        // if(elementIndex !== -1)
        // {
        //     p.comments.splice(p.comments[elementIndex],1); //Remove the Comment
        //     await p.save();
        //     return p;
        // }
        return -1;
    }
    catch (e) {
        console.log(`ERROR WHILE DELETING A COMMENT, ${e}`);
        return e;
    }
}

//Delete a Post
async function deletePost({postID, userID})
{

    try{
        const p= await Post.findOneAndDelete({_id:postID, owner:userID}).populate('owner').populate('inquiry').populate(
            {
                path: 'comments',
                populate: {path: 'owner', model: 'User', select: {'_id': 1, 'name': 1, 'photo': 1, 'last_name': 1}}
            },
        );
        if(!p)
        {
            return -1;
        }

        return p;
    }
    catch (e) {
        console.log(`COULDN'T DELETE POST, ${e}`);
        return e;
    }
}

//-------------------------------------------------

//Authentication for WebSockets
export async function wsAuth (message)
{
    try{
        const token= message.token;

        const data= jwt.verify(token,constants.SignKey);

        const user= await User.findOne({_id:data._id, 'tokens.token':token }) //Find a user with his ID and with this Token, if found => Authenticated

        if(!user)
        {
            return false;
        }

        console.log(`${user._id} is Authenticated `);
        return true;
    }catch (e) {
        return false;
    }
}



//------------------------------------------------

// import prandom from "prandom";
//
// import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
//
//
// //Generate Random OTP passwords.
//
// function generateOTP()
// {
//     return prandom.otp(6); //Generate Random OTP, it's length is 6 characters.
// }
//
// const mailerSend= new MailerSend({apiKey:'mlsn.d25709e1ebbf021745bb3c4f46796c3e2e0a8751c3f3befe330e3225a12212e1'});
// const sentFrom = new Sender("mhd@deepfake.com", "Mohammad");
// const recipients = [
//     new Recipient("bluntgeorge348@google.com", "Blunt"),
// ];
//
// async function sendMail() {
//     const e = new EmailParams().setFrom(sentFrom).setTo(recipients).setSubject("This is Test 1").setText(`${generateOTP()}`);
//
//     await mailerSend.email.send(e);
// }



//----------------------------------------------------

//Get AI News and Store it in database.
async function getNews()
{
    console.log('In Getting News...');

    // request({url:constants.gNewsURL, json:true,}, async (error, response) => {
    //     if (error) {
    //         console.log(`ERROR WHILE GETTING NEWS, ${error.toString()}`);
    //     } else if (response) {
    //         console.log(`GOT DATA, ${response.body.totalArticles}`);
    //         await storeNews(response);
    //     }
    // });

    axios.get(constants.gNewsURL).then(async (result) => {
        console.log(`Got Data, ${result.data}`);
        await storeNews(result);

    }).catch((error)=>
    {
        console.log(`ERROR WHILE GETTING NEWS, ${error.message}`);
    });

}
//Store the data in database.
async function storeNews(result)
{
    console.log('Got Data to Store');

    for (const value of result.data.articles) {
        const n= new News({
            title:value.title,
            description:value.description,
            content:value.content,
            url:value.url,
            image:value.image,
            date:value.publishedAt,
        });

        try
        {
            await n.save();
            console.log('Saved Successfully');
        }
        catch (e) {
            console.log(`ERROR WHILE STORING NEWS,${e.toString()}`);

        }

    }
}

// //Send Inquiry to AI Model and get the result back
// async function sendInquiryToModel(data)
// {
//
//     try
//     {
//         //console.log(`Data to send: ${data}`);
//         const result = await axios.post(constants.modelURL, {'text':data});
//
//         if(result !==null)
//         {
//             console.log(`Got Model Result, ${result.data['predicted_class']}`);
//             return result.data;
//         }
//         return null;
//     }
//     catch (error)
//     {
//         console.log(`ERROR WHILE SENDING INQUIRY TO AI MODEL, ${error.message}, ${error}`)
//         return null;
//     }
// }

//Send Inquiry to AI Model and get the result back
async function sendInquiryFileToModel(data)
{
    try
    {
        //Create a formData and append the file to it then send it to AI Model.
        const formData = new FormData();

        formData.append('file', data.buffer, {
            filename: data.originalname,
            contentType: data.mimetype,
            knownLength: data.buffer.length,
        });

        const result = await axios.post(
            constants.modelURL,
            formData,
            {headers:{'Content-Type': 'multipart/form-data',},});


        if(result !==null)
        {
            console.log(`Got Model Result, ${result.data['predicted_class']}`);
            return result.data;
        }
        return null;
    }
    catch (error)
    {
        console.log(`ERROR WHILE SENDING INQUIRY TO AI MODEL, ${error.message}, ${error}`)
        return null;
    }
}


//Send Audio Inquiry to AI Model and get the result back
async function sendAudioFileToModel(data)
{
    try
    {
        //Create a formData and append the file to it then send it to AI Model.
        const formData = new FormData();

        formData.append('file', data.buffer, {
            filename: data.originalname,
            contentType: data.mimetype,
            knownLength: data.buffer.length,
        });

        const result = await axios.post(
            constants.audioModelURL, // TO BE FILLED WITH CORRECT URL
            formData,
            {headers:{'Content-Type': 'multipart/form-data',},});


        if(result !==null)
        {
            console.log(`Got Audio Model Result, ${result.data['predicted_class']}`);
            return result.data;
        }
        return null;
    }
    catch (error)
    {
        console.log(`ERROR WHILE SENDING AUDIO INQUIRY TO AI MODEL, ${error.message}, ${error}`)
        return null;
    }
}

//Send Image Inquiry to AI Model and get the results back
async function sendImageFileToModel(data)
{
    try
    {
        //Create a formData and append the file to it then send it to AI Model.
        const formData = new FormData();

        formData.append('file', data.buffer, {
            filename: data.originalname,
            contentType: data.mimetype,
            knownLength: data.buffer.length,
        });

        const result = await axios.post(
            constants.imageModelURL, // TO BE FILLED WITH CORRECT URL
            formData,
            {headers:{'Content-Type': 'multipart/form-data',},});


        if(result !==null)
        {
            console.log(`Got Image Model Result, ${result.data['predicted_class']}`);
            return result.data;
        }
        return null;
    }
    catch (error)
    {
        console.log(`ERROR WHILE SENDING IMAGE INQUIRY TO AI MODEL, ${error.message}, ${error}`)
        return null;
    }
}

export default {analyseMessageType, wsAuth, getNews, sendInquiryFileToModel, sendAudioFileToModel, sendImageFileToModel}
