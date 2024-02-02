const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require('body-parser');
const server = express();
const port = 3000;
const url = "mongodb://127.0.0.1:27017/jokes_db";

const jokes_scheme = new mongoose.Schema({
  _id: Number,
  content: String,
  likes: Number,
  dislikes: Number
});
const categories_scheme = new mongoose.Schema({
  _id: Number,
  category: String,
  jokes: [Number]
});

const connection = mongoose.createConnection(url);
const jokes = connection.model('jokes', jokes_scheme);
const categories = connection.model('categories', categories_scheme);

server.use(bodyParser.json());
server.get("/jokes", async function (req, res) {
  try{
    const what_found = await jokes.find();
    res.send(what_found);
  }
  catch{
    res.json({Error:"Server or database error"});
  }
  
});

// Retrieve a random joke from all jokes in the database
server.get("/jokes/random", async function (req, res) {
  try{
    const what_found = await jokes.find();
    const random_joke = what_found[Math.floor(Math.random() * what_found.length)];
    res.send(random_joke);
  }
  catch{
    res.json({Error:"Server or database error"});
  }
  
});

// Retrieve a random joke from a category of jokes
server.get("/jokes/random/:category", async function (req, res) {
  try{
    const what_found = await categories.findOne({category:req.params.category});
    
    if (what_found ){
      if (what_found["jokes"].length>0){
        const random_joke_id = what_found["jokes"][Math.floor(Math.random() * what_found["jokes"].length)];
        const random_joke = await jokes.findById(random_joke_id);
        res.send(random_joke);
      }
      else{
        res.json({Empty:"no jokes for the provided category were found"});
      }
    }
    else{
      res.json({Error:"no category was found"});
    }
  }
  catch {
    res.json({Error:"Server or database error"});
  }
});

// Retrieve a list of categories
server.get("/categories", async function (req, res) {
  try{
    const what_found = await categories.find();
    res.send(what_found);
  }
  catch{
    res.json({Error:"Server or database error"});
  }
});

// Retrieve all jokes for a category
server.get("/jokes/categories/:category", async function (req, res) {
  try{
    const what_found = await categories.findOne({category:req.params.category});
    if (what_found){
      const jokes_id = what_found["jokes"];
      const jokes_found = await jokes.find({ '_id': {$in : jokes_id }});
      res.send(jokes_found);
    }
    else{
      res.json({Error:"no jokes with provided category were found"});
    }
  }
  catch{
    res.json({Error:"Server or database error"});
  }
  
});

// Retrieve a joke by id 
server.get("/jokes/:id", async function (req, res) {
  try{
    const id = req.params.id;
    const what_found = await jokes.findById(id);

    if (!what_found){
      res.json({Error:"no joke with provided id was found"});
    }
    else {
      res.send(what_found);
    }
  }
  catch{
    res.json({Error:"Server or database error"});
  }
});

// Add a new category of jokes 
server.post("/categories", async function (req, res){
  try {
    const last_id_item = await categories.findOne().sort({"_id":"desc"});
    const last_id = last_id_item["_id"];
    const new_id = last_id + 1;
    const new_category = new categories({
      _id:  new_id,
      category: req.body.category,
      jokes: []
    });
    
    await new_category.save();
    console.log(last_id);
    res.json({Succes:"New category was added"});
  }
  catch {
    res.json({Error:"Server or database error"});
  }
});

// Add a new joke to a category 
server.post("/jokes", async function (req, res) {
  try {
    const last_id_item = await jokes.findOne().sort({"_id":"desc"});
    const last_id = last_id_item["_id"];
    const new_id = last_id + 1;
    const new_joke = new jokes({
      _id:  new_id,
      content: req.body.content,
      likes: 0,
      dislikes: 0
    });
    const category_found = await categories.findOne({"category":req.body.category});
    if (category_found){
      await new_joke.save();
      category_found["jokes"].push(new_id);
      await category_found.save();
      res.json({Succes:"New joke was added"});
    }
    else{
      res.json({Error:"No category was found"});
    }
  }
  catch {
    res.json({Error:"Server or database error"});
  }
  
});

// Add an existing joke to a category by joke id (a joke can belong in multiple categories) 
server.post("/jokes/:id", async function (req, res) {
  try {
    const joke = await jokes.findById(req.params.id);
    const category_found = await categories.findOne({"category":req.body.category});
    if (category_found){
      category_found["jokes"].push(joke["_id"]);
      await category_found.save();
      res.json({Succes:"Existing joke was added to a category"});
    }
    else{
      res.json({Error:"No category was found"});
    }
  }
  catch {
    res.json({Error:"Server or database error"});
  }
});

// Give a joke (by id) a vote of like or dislike (>0 ; <=0)
server.get("/jokes/:id/:vote", async function (req, res) {
  try {
    const joke = await jokes.findById(req.params.id);
    if (joke){
      if (req.params.vote>0){
        joke["likes"] += 1;
      }
      else{
        joke["dislikes"] += 1;
      }
      await joke.save();
      res.json({Succes:"A vote was added"});
    }
    else{
      res.json({Error:"No joke was found"});
    }
  }
  catch {
    res.json({Error:"Server or database error"});
  }
});


server.listen(port, function () {
  console.log("Server  http://127.0.0.1:"+port);
});