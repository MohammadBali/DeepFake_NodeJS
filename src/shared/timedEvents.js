import components from "./components.js";


const dayInMs= 86400000;  //1000 Second * 60 Minutes * 60 Hour * 24 => Happens Only Once


export default setInterval(async () => {
    console.log('in Timed Events');
    const news = await components.getNews();
}, dayInMs);



