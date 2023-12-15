const SignKey='default_Key_to_sign';

const gNewsAPI='097ec9dd1f05c57c5109d06acbc3a9bf';

const gNewsURL=`https://gnews.io/api/v4/search?q=artificial intelligence OR AI&lang=en&country=us&max=10&apikey=${gNewsAPI}&sortby=relevance`;

const modelURL='http://ec2-3-120-39-18.eu-central-1.compute.amazonaws.com:8000/predict';

const audioModelURL='';

export default  {SignKey, gNewsAPI, gNewsURL, modelURL, audioModelURL}