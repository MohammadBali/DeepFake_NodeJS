import express from "express";
import {User} from "../models/user.js";
import auth from "../middleware/auth.js";

const router= express.Router();

//Add a new User
router.post('/addUser',async (req,res)=>{

    try{
        const user= new User(req.body);

        if(req.body.firebaseToken !=null)
        {
            await user.addFirebaseToken(req.body.firebaseToken); //Adding firebase token

            const token=await user.generateAuthToken();

            res.status(201).send({user, token, success:1});
        }

        else
        {
            await user.save();
            const token=await user.generateAuthToken();

            res.status(201).send({user, token, success:1});
        }
    }

    catch (e) {
        console.log(`Error While Adding a user, ${e}`);
        res.status(400).send({error:"Couldn't Sign you", message:e.message , success:0});
    }
});


//Get All Users,  Parameters are: PATH - Middleware - Handlers
router.get('/users', auth.userAuth, async (req, res) => {
    try {
        const u= await User.find();
        res.status(200).send(u)
    } catch (e) {
        res.status(500).send(e);
    }
});


//Get Your User Data,  Parameters are: PATH - Middleware - Handlers
router.get('/users/me', auth.userAuth, async (req, res) => {
    res.status(201).send(req.user); // The User came from request since we did it in the auth.auth function, we did set the req.user to the user that was found.
});

//Get a Specific User with ID
router.get('/users/:id',async (req, res) => {

    try {
        const id = req.params.id;
        const u = await User.findById(id);
        if(!u)
        {
            return res.status(404).send({'error':'No User has been found'});
        }
        res.status(200).send(u);
    } catch (e) {
        res.status(500).send(e);
    }
});

//Update a User
router.patch('/users/me', auth.userAuth, async (req, res) => {
    const updates= Object.keys(req.body);
    const allowedUpdates=['name','last_name','password','email', 'photo'];

    const isValid= updates.every((update)=>allowedUpdates.includes(update));

    if(!isValid)
    {
        return res.status(404).send({'error':'A Not Allowed Field has been used'});
    }

    try {
        //This Method was used instead of findByIdAndUpdate, so it runs through the middleware. LOAD  USER by ID, then SET HIS DATA, then user.save()

        const user= req.user;

        //Check for the provided email, if it exists then deny the user request
        if(updates.includes('email'))
        {
            const e = await User.findOne({email:req.body['email']});

            if(e)
            {
                return res.status(400).send({'error':'This email has been used before'});
            }
        }

        updates.forEach((update)=>
        {
            user[update]=req.body[update];
        });

        await user.save();

        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

        if (!user) {
            return res.status(404).send({'error': 'no such user has been found'});
        }
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }

});

//Delete a User, uses middleware for auth.authentication
router.delete('/users/delete', auth.userAuth, async (req, res) => {
    try {
        const u = await User.findOneAndDelete(req.user._id);
        if (!u) {
            res.status(4040).send({'error': 'no such user'});
        }

        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

//Login a User
router.post('/users/login', async (req,res)=>{

    try {
        const user= await User.findByCredentials(req.body.email,req.body.password);

        const token= await user.generateAuthToken();

        if(req.body.firebaseToken !=null)
        {
            await user.addFirebaseToken(req.body.firebaseToken);
        }

        res.send({user,token, success:1});
    }catch (e) {
        res.status(400).send({'error':'Couldn\'t Login', 'message':e.toString(), success:0});
    }
});

//Logout a User
router.post('/users/logout',auth.userAuth, async(req, res)=>{

    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token;
        }); //Removing the token that the user provided from the token lists.

        req.user.firebaseTokens=''; //Removing the firebaseToken of the logged out device.
        await req.user.save(); //Saving that user

        res.status(200).send({'message':'Logged out successfully'});
    }catch (e) {
        res.status(500).send(e);
    }
});

//Logout of all Tokens for a User
router.post('/users/logoutAll',auth.userAuth, async (req, res)=>{

    try{
        req.user.tokens=[];

        await req.user.save();
        res.status(200).send({'message':'Logged Out of all devices Successfully'});
    }catch (e) {
        res.status(500).send(e);
    }

});

//Get a User Profile by his ID, for showing profile and posts.
router.get('/users/getAUserProfile/:id', auth.userAuth, async (req,res)=>{

    console.log('Getting a User Profile');

    try
    {
        const id= req.params.id;

        const u= await User.findOne({_id:id});

        if(!u)
        {
            return res.status(404).send({'error':'No User has been found'});
        }

        await u.populate({
            path:'posts',
            populate:
                [
                    {path:'inquiry'},
                    {path:'comments', populate:{path:'owner', model:'User', select:{'_id':1, 'name':1, 'photo':1, 'last_name':1} } }
                ],
            options:{ sort:{createdAt:-1}, }, //Return Data with the last createdAt (newest first)
        });

        res.status(200).send({owner:u, posts:u.posts});
    }
    catch (e) {
        res.status(500).send({error:e, message:e.message});
    }
});

//Add or Remove a subscription to a User
router.post('/manageSubscription/:id', auth.userAuth, async (req, res)=>{
    console.log('In Adding a Subscription');

    try
    {
        const uId=req.params.id;

        const subUser= await User.findOne({_id:uId});

        if(!subUser)
        {
            return res.status(404).send({'error':'No Such User has been found'});
        }

        else
        {
            if(req.user.subscriptions.some(sub=>sub.owner_id.toString() === uId) )
            {
                req.user.subscriptions = req.user.subscriptions.filter((sub)=>
                {
                    return sub.owner_id.toString() !== uId;
                }); //Removing the subscribed user id.

                await req.user.save();

                return res.status(201).send({user:req.user, status:'removed user ${uId}', removed_user_id:uId});
            }
            else
            {
                req.user.subscriptions= req.user.subscriptions.concat({'owner_id':uId});

                await req.user.save();

                return res.status(201).send({user:req.user, status:`added user ${uId}`, added_user_id:uId} );
            }


        }
    }
    catch (e) {
        console.log(`ERROR WHILE ADDING A SUBSCRIPTIONS, ${e.toString()}`);
        res.status(500).send(e);
    }
});

//Return the subscribed users
router.get('/getSubscriptions', auth.userAuth, async(req,res)=>{
    console.log('In Getting Subscriptions');
    try
    {
        await req.user.populate('subscribedUsers');

        //await req.user.populate({path:'subscriptions.owner_id', model:'User', select: {'owner_id':1, 'photo':1, 'name':1, 'last_name':1}});

        res.status(200).send({subscriptions:req.user.subscriptions});

    }
    catch (e) {
        console.log(`ERROR WHILE GETTING SUBSCRIPTIONS, ${e.toString()}`);
        res.status(500).send(e);
    }

});

//Return the details of the subscribed users
router.get('/getSubscriptionsDetails', auth.userAuth, async(req,res)=>{

    try
    {
        await req.user.populate('subscriptions.owner_id');
        res.status(200).send({subscriptions:req.user.subscriptions});
    }
    catch (e) {
        console.log(`ERROR WHILE GETTING SUBSCRIPTIONS DETAILS, ${e.toString()}`);
        res.status(500).send(e);
    }
});


export default router
