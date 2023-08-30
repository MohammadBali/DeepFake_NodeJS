import mongoose, {Schema} from "mongoose";

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
            values:['text','audio'],
            message:"Type Does not match text or audio",
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


export const Inquiry= mongoose.model('Inquiry', inquirySchema);