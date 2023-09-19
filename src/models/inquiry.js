import mongoose, {Schema} from "mongoose";
import {Post} from "./post.js";
import {User} from "./user.js";

const inquirySchema= new mongoose.Schema({
    name:{
        type:String,
        cast:false,
        required:true,
        trim:true,
    },

    type:{
        type:String,
        cast:false,
        required:true,
        trim:true,
        lowercase:true,
        enum:{
            values:['text','audio','image'],
            message:"Type Does not match text, image or audio",
        },
    },

    data:{
        type:mongoose.Schema.Types.Mixed,
        cast:true,
        required:true,
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User', //To Reference it to which it came from => we get HELPER METHODS. We can now through inquiry.owner we can get task.owner.name. BEFORE CALLING USE inquiry.populate ('owner').execPopulate().
        // EXAMPLE: const inquiry= await inquiry.findById("----");
        // await inquiry.populate('owner').execPopulate(); now I can do console.log(inquiry.owner.name)
    },

    result:{
        type:String,
        required:true,
        cast:false,
        trim:true,
    }

},{timestamps:true});


// inquirySchema.virtual('',{
//
// });

//Delete Posts of this Inquiry when the inquiry gets deleted.
inquirySchema.pre('findOneAndDelete', async function(next)
{
    const inquiry= await Inquiry.findOne(this.getQuery());

    console.log(`Inquiry ID to be Deleted: ${inquiry._id}`);
    await Post.deleteMany({inquiry:inquiry._id});
    next();
});


export const Inquiry= mongoose.model('Inquiry', inquirySchema);