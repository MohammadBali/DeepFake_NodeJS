import jwt from "jsonwebtoken";
import {User} from "../models/user.js"
import constants from "../shared/constants.js";
export const auth= async(req,res,next)=>{
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
        console.log(`${user._id} is Authenticated `);
        next();
    }catch (e) {
        res.status(401).send({error:'Not Authenticated', e});
    }
};
