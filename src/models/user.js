import mongoose, {mongo} from "mongoose";
import validator from "validator";

import {Inquiry} from "./inquiry.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import constants from "../shared/constants.js";
import {Post} from "./post.js";
import moment from "moment";

import uniqueValidator from "mongoose-unique-validator";

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        cast:false,
        required:true,
        trim:true
    },

    last_name:{
        type:String,
        cast:false,
        required:true,
        trim:true
    },

    gender:{
        type:String,
        cast:false,
        required:true,
        trim:true
    },

    birthDate:{
        type:String,
        cast:false,
        required:true,
        trim:true,
        validate(value)
        {
            return moment(value,'DD/MM/YYYY').isValid();
        },

        set: function (value)
        {
            const date = moment(value, 'DD/MM/YYYY', true);
            if (date.isValid()) {
                return date.format('DD/MM/YYYY');
            }
            return value;
        }
    },

    email:{
        type:String,
        cast:false,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        validate(value)
        {
            if(!validator.isEmail(value))
            {
                throw Error('The Email Provided is not a correct syntax.');
            }
        },

    },

    password:{
        type:String,
        //cast:false,
        required:true,
        trim:true,
        minLength:7,
        validate(value){
            if(value.toLowerCase().includes('password')) //The Password contains the word password
            {
                throw Error('Password format is not correct');
            }
        },
    },

    tokens:
    [
        {
            token:{
                type:String,
                required:true
            },
        }
    ],

    firebaseTokens:
    {
        type:String,
        required:false,
    },

    photo:
    {
        type:String,
        required:false,
        cast:false,
        trim:true,
        default:'robot_2.jpg',
    },

    subscriptions:[
        {
            owner_id:{
                type:mongoose.Schema.Types.ObjectId,
                required:true,
                ref:'User',
            },
        }
    ],

    isOfficial:{
        type:Boolean,
        default:false,
        required:false,
    },

    //For Account Activation via Email (Send OTP)
    // isVerified:{
    //     type:Boolean,
    //     required:false,
    //     default:false,
    // },
    //
    // OTP:{
    //     type:Number,
    //     required:false,
    // },

},{timestamps:true});


userSchema.plugin(uniqueValidator);

//Telling Mongoose that the user is foreign key for Inquiry.
userSchema.virtual('inquiries',{
    ref:'Inquiry',
    localField:'_id',
    foreignField:'owner',
});


//Telling Mongoose that the user is foreign key for Posts.
userSchema.virtual('posts',{
    ref:'Post',
    localField:'_id',
    foreignField:'owner',
});


userSchema.virtual('subscribedUsers',{
    ref:'User',
    localField:'_id',
    foreignField:'subscriptions.owner_id',
});


//Hashing Password before Saving
userSchema.pre('save',async function (next){
    const user=this;

    if(user.isModified('password')) //Check if the password is being changed => Hash it
    {
        console.log('in Pre User, Hashing Password...');
        user.password= await bcrypt.hash(user.password,8);
    }

    next(); //Call it so Mongoose knows we are done doing the Middleware work
});

//Deleting User's inquiries and posts and comments before removing them
userSchema.pre('findOneAndDelete', async function(next)
{
    const u= await User.findOne(this.getQuery());

    console.log(`User ID to be Deleted: ${u._id}`);
    await Inquiry.deleteMany({owner:u._id});
    await Post.deleteMany({owner:u._id});

    // Remove user's comments from all posts
    await Post.updateMany(
        { 'comments.owner': u._id }, // Find posts where the user has comments
        { $pull: { comments: { owner: u._id } } } // Remove comments by the user to be deleted
    );

    // Remove user's likes from all posts
    await Post.updateMany(
        { 'likes.owner': u._id }, // Find posts where the user has likes
        { $pull: { likes: { owner: u._id } } } // Remove likes by the user to be deleted
    );

    //Remove this user from other user's subscriptions list
    await User.updateMany(
        {'subscriptions.owner_id':u._id},
        { $pull: { subscriptions: { owner_id: u._id } } }
    );


    next();
});


//Create a function to findCredentials
userSchema.statics.findByCredentials= async (email,password)=>{

    const user= await User.findOne({email});
    if(!user)
    {
        throw Error('Unable to Login, No Such user exists');
    }

    //Hash the password and compare it to the stored hash.
    const isMatch=await bcrypt.compare(password,user.password);

    //Password is Wrong
    if(!isMatch)
    {
        throw Error('Wrong Credentials');
    }

    return user;
}

//Generate Authorization Tokens.
userSchema.methods.generateAuthToken= async function() {
    const user=this;
    const token= jwt.sign({_id: user._id.toString()}, constants.SignKey);

    user.tokens=user.tokens.concat({token}); //Adding Token to the user database, so we can get it later on
    await user.save();

    return token;
};

//Add the Firebase Token into the user's data
userSchema.methods.addFirebaseToken= async function(token)
{
    try
    {
        const user=this;
        //The current saved token is different from the passed one
        if(user.firebaseTokens !== token)
        {
            console.log('In Storing user Firebase token...');
            user.firebaseTokens=token;
            await user.save();
        }
        else
        {
            console.log('Firebase token is the same as stored...');
        }
    }
    catch (e)
    {
        console.log(`ERROR WHILE ADDING FIREBASE TOKEN, ${e}`);
        throw Error(`${e}`);
    }


    //OLD Method for having multi tokens for firebase => now only one device will be saved
    // if(user.firebaseTokens.some(tokenObj => tokenObj.token ===token) ===false)
    // {
    //     console.log('In Storing user Firebase token...');
    //     user.firebaseTokens=user.firebaseTokens.concat({token});
    //     await user.save();
    // }

};


//Automatically call when user is called, you can do it manually through naming it something and calling it when needed
userSchema.methods.toJSON= function()
{
    const user=this; //Get the value of what is referencing it
    const userObject= user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.firebaseTokens;

    return userObject;
};


export const User= mongoose.model('User', userSchema);