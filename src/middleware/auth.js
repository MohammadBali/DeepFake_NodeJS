import jwt from "jsonwebtoken";
import {User} from "../models/user.js"
import constants from "../shared/constants.js";
import multer from "multer";

const userAuth= async(req, res, next)=>{
    try{
        const token= req.header('Authorization').replace('Bearer ','');

        const data= jwt.verify(token,constants.SignKey);

        const user= await User.findOne({_id:data._id, 'tokens.token':token }) //Find a user with his ID and with this Token, if found => Authenticated

        if(!user)
        {
            throw new Error();
        }
        req.token=token; //Add the token for logout session
        req.user=user;
        //console.log(`${user._id} is Authenticated `);
        next();
    }catch (e) {
        res.status(401).send({error:'Not Authenticated', e});
    }
};

//Image Authenticator, if image is larger than 5 MB => Error, if image type is not (jpg,jpeg,png) => Error
const imageAuth= multer({
    limits:{
        fileSize:10000000, //10 MB
    },

    fileFilter(req,file,cb)
    {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
        {
            return cb(new Error('Image Type is incorrect'));
        }

        if(file.size >10000000)
        {
            return cb(new Error('Image File Size is larger than 10 MB'));
        }

        cb(undefined,true);
    }
});


//Audio Authenticator, if audio file is larger than 50 MB => Error, if audio type is not (mp3,wav,m4a,flac) => Error
const audioAuth= multer({
    limits:{
        fileSize: 20000000, //20MB
    },

    fileFilter(req,file,cb)
    {
        if(!file.originalname.match(/\.(mp3|wav|m4a|flac)$/))
        {
            return cb(new Error('Audio Type is incorrect'));
        }

        if(file.size >20000000)
        {
            return cb(new Error('Audio File Size is larger than 20 MB'));
        }

        cb(undefined,true);
    },
});


const textAuth= multer({
    limits:{
        fileSize: 15000000, //15MB
    },

    fileFilter(req,file,cb)
    {
        if(!file.originalname.match(/\.(txt|doc|docx|pdf)$/))
        {
            return cb(new Error('Text Type is incorrect, in txtAuth. Type must be txt,doc,docx,pdf'));
        }

        if(file.size >15000000)
        {
            return cb(new Error('Text File Size is larger than 15 MB'));
        }
        cb(undefined,true);
    },
});

export default {textAuth, audioAuth,imageAuth,userAuth};