import mongoose from "mongoose";

const newsSchema= new mongoose.Schema({

        title:{
            type:String,
            required:true,
            cast:false,
            trim:true,
            unique:true,
        },

        description:{
            type:String,
            required:true,
            cast:false,
            trim:true,
            unique:true,
        },

        content:{
            type:String,
            required:true,
            cast:false,
        },

        url:{
            type:String,
            required:true,
            cast:false,
        },

        image:{
            type:String,
            required:true,
            cast:false,
        },

        date:{
            type:Date,
            required:true,
        },


}, {timestamps:true,});




export const News= mongoose.model('News',newsSchema);