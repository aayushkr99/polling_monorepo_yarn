const express = require("express");
const cors = require('cors')
const app = express();
const PORT = process.env.PORT || 5000;
const axios = require('axios')
// const router = require("./src/routes/route")
app.use(cors());
app.use(express.json());

const Redis = require('ioredis');
const redisClient = new Redis({
  host: 'redis', // Redis container service name
  port: 6379,    // Default Redis port
});

app.post( "/api/redis-data",async (req, res) => {
  try{
    const { activity_id, heading } = req.body;
    console.log("request body -=-=-=-=", req.body)
    if (!heading || !activity_id) throw "Missing data";
    const val = await redisClient.hmset(`heading:${activity_id}`, {'heading' : heading })
    return res.status(201).send(`Data saved to ${heading},  ${val}`);

  }catch(error){
    console.log(error.message)
    throw new Error(error.message)
  }
})

app.get('/api/redis-data', async (req, res) => {
    try {
      const data = await redisClient.get(req.body.key);
      res.json({ data });
    } catch (error) {
      console.error('Error fetching data from Redis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.post('/api/redis-data/search',  async (req, res) => {
  try{
    const {searchval} = req.body
    if(searchval != ""){
      const data = await redisClient.send_command('FT.SEARCH', ['idx:heading', `${searchval}*`]);
      res.json({status: true, data : data});
    }else{
      res.json({status : false, message : "search value cannot be empty"})
    }
  }catch(error){
    console.log(error);
    res.status(500).json({error: `Server error: ${error}`})
  }
})

app.post('/add/search/data/all', async(req, res) => {
  const query = `
  query MyQuery {
    activity {
      heading
      id
    }
  }
  `
  try{
    const data = await axios.post("http://localhost:8080/v1/graphql",query )
    
    const response = data.data.activity
    for(let obj of response){
      const val = await redisClient.hmset(`heading:${obj.id}`, {'heading' : obj.heading })
      console.log("added to redis -=-=-", val)
    }
    res.json({status :true, message : "data added to redis successfully"})

  }catch(err){
    console.log(err)
    res.status(500).json({error: `Server error: ${err}`})
  }
})


// app.use("/", router)
app.use("/test" , (req, res) => {
  res.send("Hi there!, test API, Please Ignore")
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/*
HSET heading:a644f5d9-f8ec-433b-adf1-bd6034860869 heading " Favorite Indian Foods: A Culinary Journey Through Flavorful Delights !"  // heading
FT.CREATE idx:heading ON hash PREFIX 1 "heading:" SCHEMA heading TEXT SORTABLE
FT.SEARCH idx:heading "election" RETURN 1 heading
FT.DROP idx:activity


 docker exec -it hasura_tut_redis_1 redis-cli
 docker-compose restart nginx
 docker exec -it client_api_1 /bin/bash


*/