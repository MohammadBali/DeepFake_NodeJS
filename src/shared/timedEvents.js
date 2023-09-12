import components from "./components.js";


const dayInMs= 86400000;  //1000 Second * 60 Minutes * 60 Hour * 24 => Happens Only Once

const news = async () => {
    await components.getNews();
};

export default {news, dayInMs}



