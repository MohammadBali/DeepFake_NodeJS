import mongoose, {Schema} from "mongoose";
import validator from "validator";

import {Inquiry} from "./inquiry.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import constants from "../shared/constants.js";


const userSchema= new mongoose.Schema({
    name:{
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

    tokens:[
        {
            token:{
                type:String,
                required:true
            },
        }],

    photo:{
        type:String,
        required:false,
        cast:false,
        trim:true,
    }

},{timestamps:true});

//Telling Mongoose that the user is foreign key for Inquiry.
userSchema.virtual('inquiries',{
    ref:'Inquiry',
    localField:'_id',
    foreignField:'owner',
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

//Deleting User's inquiries before removing them
userSchema.pre('findOneAndDelete', async function(next)
{
    const u= await User.findOne(this.getQuery());

    console.log(`User ID to be Deleted: ${u._id}`);
    await Inquiry.deleteMany({owner:u._id});
    next();
});


//Create a function to findCredentials
userSchema.statics.findByCredentials= async (email,password)=>{

    const user= await User.findOne({email});

    if(!user)
    {
        throw Error('Unable to Login');
    }

    const isMatch=await bcrypt.compare(password,user.password);

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


//Automatically call when user is called, you can do it manually through naming it something and calling it when needed
userSchema.methods.toJSON= function()
{
    const user=this; //Get the value of what is referencing it
    const userObject= user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
};

export const User= mongoose.model('User', userSchema);