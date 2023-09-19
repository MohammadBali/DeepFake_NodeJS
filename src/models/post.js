import mongoose from "mongoose";
import {Inquiry} from "./inquiry.js";

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