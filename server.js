const express = require("express")
const fetch = require("node-fetch")
const redis = require("redis")

const PORT = 8080
const REDIS_PORT = 6379

const client = redis.createClient(REDIS_PORT)

const app = express()

function setResponse(username,repos){
    return `<h2>${username} has ${repos} Github repos</h2>`
}

//make req github for data
async function getRepos(req,res){
    try{
      console.log('fetching data')
      const {username} = req.params
      const response = await fetch(`http://api.github.com/users/${username}`)
      const data = await response.json()
      const repos = data.public_repos

      //set data to redis
      client.setex(username,3600,repos)

      res.send(setResponse(username,repos))
    }
    catch(err){
      console.error(err)
      res.status(500)
    }
}

//cache middleware
function cache(req,res,next){
  const {username} = req.params
  client.get(username,(err,data)=>{
      if(err) throw err
      if(data != null){
          res.send(setResponse(username,data))
      }else{
          next()
      }
  })
}

app.get('/repos/:username',cache,getRepos)

app.listen(PORT,()=>{
    console.log("server is running")
})

