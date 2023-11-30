import rootPath from "get-root-path";
import firebaseAdmin from "firebase-admin";
import {getMessaging} from "firebase-admin/messaging";

const currentRootPath=rootPath.rootPath;

const serviceKeyPath=`${currentRootPath}/src/firebase/firebaseServiceKey.json`;


const mm={
    token:'ea-Wu-Q5TeeczdkV8MCkbO:APA91bG-V1Wauf4x3tahOJHTyOLdzNFJMy5HV6gVfskvmG8RWGzJWBtOyiaICgbAKq7MCZInGSx6czHh-N5hqG5UK4KQamNZR6pFegzo6JY87D1wuIHVC6ogq7EtnCInoRswcUZHFWXX',
    notification:
    {
        title: 'DeepGuard',
        body: 'DeepGuard for everyone 2'
    },
    android:
    {
        priority: 'HIGH',
        notification:{
            title: 'DeepGuard',
            body: 'DeepGuard for everyone 2'
        },
    },
    data:{
        'myKey':'myValue',
    },
};

function sendFirebaseNotification(message)
{
    getMessaging().send(message).then((value)=>
    {
        console.log(`Message has been sent successfully, ${value}`);
    }).catch((error)=>
    {
        console.log(`ERROR WHILE SENDING FIREBASE NOTIFICATION, ${error.toString()}`);
    });

}


function setFirebaseNotificationMessage(token, notificationTitle, notificationBody, data)
{
    return {
        token:token,
        notification:
            {
                title: notificationTitle,
                body: notificationBody
            },
        android:
            {
                priority: 'HIGH',
                notification:{
                    title: notificationTitle,
                    body: notificationBody
                },
            },
        data:data,
    };


}


async function test()
{
    await firebaseAdmin.firestore().collection('mail').add({
        to:'',
        message:{
            subject:'',
            html:'',
        },
    });
}
export default {serviceKeyPath, sendFirebaseNotification, setFirebaseNotificationMessage}