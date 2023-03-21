const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => 
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  next();
});

const url = 'mongodb+srv://alexslort:COP4331@cluster0.pmypipy.mongodb.net/LargeProject?retryWrites=true&w=majority';
const MongoClient = require("mongodb").MongoClient;
const mongo = require("mongodb");
const client = new MongoClient(url);
client.connect(console.log("mongodb connected"));


//Login
app.post('/api/login', async (req, res, next) => 
{
  // incoming: email, password
  // outgoing: id, firstName, lastName, email, password, bar, error

  //alexslort@gmail.com
  //alex123

  var error = '';
  const { login, password } = req.body;
  const db = client.db("LargeProject");
  const results = await db.collection('users').find({email:login, password:password}).toArray();

  var id = -1;
  var fn = '';
  var ln = '';
  var em = '';
  var pass = '';
  var bar = '';
  var sd;

  if( results.length > 0 )
  {
    id = results[0]._id
    fn = results[0].firstName
    ln = results[0].lastName;
    em = results[0].email;
    pass = results[0].password;
    bar = results[0].bar;
    sd = results[0].savedDrinks;
    //fing = bar[0];
    //Iib = bar.length;

    var ret = { _id:id, firstname:fn, lastName:ln, bar:bar, savedDrinks:sd, error:''};
    res.status(200).json(ret);

  }

  else{
    var ret = {error: 'no user found'};
    res.status(200).json(ret);
  }
});

// Register or Create User
app.post('/api/createUser', async (req, res, next) => 
{
  // incoming: firstName, lastName, email, password
  // outgoing: id, firstName, lastName, email, password, bar, error

  var error = '';
  const { first, last, email, password } = req.body;
  const db = client.db("LargeProject");
  //const results = await db.collection('users').insertOne({firstName:first, lastName:last, email:email, password:password, bar:''}).toArray();
  const search = await db.collection('users').find({email:email}).toArray();



  if( search.length > 0 )
  {
    var results = {error: 'user already exists'};
    res.status(200).json(results);
  }

  else{
    const results = await db.collection('users').insertOne({firstName:first, lastName:last, email:email, password:password, bar:[], savedDrinks:[]});
    res.status(200).json(results);
  }
});

// Search Ingredients
app.post('/api/searchIngredient', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error
  var error = '';
  const { search } = req.body;
  var _search = search.trim();
  
  const db = client.db("LargeProject");
  const results = await db.collection('ingredients').find({"ingredient":{$regex:_search+'.*', $options:'i'}}).toArray();
  
  
  var _ret = [];
  for( var i=0; i<results.length; i++ )
  {
    _ret.push( results[i]);
  }
  
  var ret = {results:_ret, error:error};
  res.status(200).json(ret);
});

// Get Drinks
app.post('/api/getDrinks', async (req, res, next) => 
{
  // incoming: userId
  // outgoing: drink data
  var error = '';
  const { userId } = req.body;
  var o_id = new mongo.ObjectId(userId);
  //console.log(userID);
  
  const db = client.db("LargeProject");
  const user = await db.collection('users').find({_id:o_id}).toArray();
  //console.log(user);
  
  
  if( user.length > 0 )
  {
    var bar = user[0].bar;
    //fing = bar[0];
    //Iib = bar.length;
    //const drinks = await db.collection('Drinks').find({}).toArray();
    //console.log(bar);
    var ret = [];
    const makeDrink = await db.collection('Drinks').find({ingNeeded: { $not: {$elemMatch: { $nin: bar}}}}).toArray();
    //console.log(makeDrink.length);

    for( var i=0; i<makeDrink.length; i++ )
    {
      //ingNeed = drinks[i].ingNeeded;
      //console.log(makeDrink[1]);
      ret.push(makeDrink[i]);
      //const makeDrink = db.collection('Drinks').find({tags: { $all: [bar] }});
    }
    //ingNeed = drinks[1].ingNeeded;
    var ree = {Drinks:ret};

    
    res.status(200).json(ret);


  }
  else{
    var ret = {error: 'no user found'};
    res.status(200).json(ret);
  }
  
  
});

// Search Drink 
app.post('/api/searchDrink', async (req, res, next) => 
{
  // incoming: search
  // outgoing: results[], error
  var error = '';
  const { search } = req.body;
  var _search = search.trim();
  
  const db = client.db("LargeProject");
  const results = await db.collection('Drinks').find({"name":{$regex:_search+'.*', $options:'i'}}).toArray();
  
  
  var _ret = [];
  for( var i=0; i<results.length; i++ )
  {
    _ret.push( results[i]);
  }
  
  var ret = {results:_ret, error:error};
  res.status(200).json(ret);
});

//crashed
app.post('/api/addDrink', async (req, res, next) => 
{
  // incoming: name, ingredients needed, measurements, instructions, img
  // outgoing: id, name, ingredients needed, measurements, instructions, img
  var error = '';
  const {name, ingNeeded, ingMeasurements, instructions, img} = req.body;
  const db = client.db("LargeProject");
  const search = await db.collection('Drinks').find({name:name}).toArray();


  if( search.length > 0 )
  {
    var results = {error: 'drink already exists'};
    res.status(200).json(results);
  }
  else{
    const results = await db.collection('Drinks').insertOne({name:name, ingNeeded:ingNeeded, ingMeasurements:ingMeasurements, instructions:instructions, img:img});
    res.status(200).json(results);
  }
});

// edit drink
app.post('/api/editDrink', async (req, res, next) =>
{
  // incoming: name, ingredients needed, measurements, instructions, img
  // outgoing: id, name, ingredients needed, measurements, instructions, img
  var error = '';
  const {name, ingNeeded, ingMeasurements, instructions, img} = req.body;
  const db = client.db("LargeProject");
  const search = await db.collection('Drinks').find({name:name}).toArray();

  if( search.length > 0 )
  {
    const results = await db.collection('Drinks').updateOne({_id: search[0]._id}, {$set :{name:name, ingNeeded:ingNeeded, ingMeasurements:ingMeasurements, instructions:instructions, img:img}});
    const updated = await db.collection('Drinks').find({name:name}).toArray();
    res.status(200).json(updated[0]);
  } else {
    var results = {error: 'drink doesnt exist'};
    res.status(200).json(results);
  }
});

//delete drink
//big e error
app.delete('/api/deleteDrinks', async (req, res, next) =>
{
  // incoming: name
  // outgoing: results[], error
  var error = '';
  const {name } = req.body;
  
  const db = client.db("LargeProject");
  const user = await db.collection('Drinks').find({name: name}).toArray();


  if(user.length>0)
  {
    const remove = await db.collection('Drinks').deleteOne({name:name});
    res.status(200).json(remove);
  }
  else
  {
    var ret = {error: 'Drink not found'};
    res.status(200).json(ret);
  }
  
});

// add and delete favorite section
app.post('/api/addFavorite', async (req, res, next) => 
{
  // incoming: search
  // outgoing: results[], error
  var error = '';
  const { userId, name } = req.body;
  var o_id = new mongo.ObjectId(userId);
  
  const db = client.db("LargeProject");
  const user = await db.collection('users').find({_id: o_id}).toArray();

  if(user.length>0)
  {
    const result = await db.collection('Drinks').find({name: name}).toArray();

    if(result.length>0)
    {
      const add = await db.collection('users').updateOne({_id:user[0]._id}, {$addToSet:{savedDrinks:name}});
      const updated = await db.collection('users').find({_id: o_id}).toArray();
      res.status(200).json(updated[0]);
    }
    else
    {
      var ret = {error: 'Drink not found'};
      res.status(200).json(ret);
    }
  }
  else{
    var ret = {error: 'user not found'};
    res.status(200).json(ret);
  }
  
});

//deleted the entire user
//asf@gmail.com asedf123
//6418f1dc2700c0cee24ac59c
app.delete('/api/deleteFavorite', async (req, res, next) => 
{
  // incoming: search
  // outgoing: results[], error
  var error = '';
  const { userId, name } = req.body;
  var o_id = new mongo.ObjectId(userId);
  
  const db = client.db("LargeProject");
  const user = await db.collection('users').find({_id: o_id}).toArray();

  if(user.length>0)
  {
    const result = await db.collection('Drinks').find({name: name}).toArray();

    if(result.length>0)
    {
      const add = await db.collection('users').updateOne({_id:user[0]._id}, {$pull:{savedDrinks:name}});
      const updated = await db.collection('users').find({_id: o_id}).toArray();
      res.status(200).json(updated[0]);
    }
    else
    {
      var ret = {error: 'Drink not found'};
      res.status(200).json(ret);
    }
  }
  else{
    var ret = {error: 'user not found'};
    res.status(200).json(ret);
  }
  
});


app.post('/api/addIngredientToBar', async (req, res, next) => 
{
  // incoming: search
  // outgoing: results[], error
  var error = '';
  const { userId, ingName } = req.body;
  var o_id = new mongo.ObjectId(userId);
  
  const db = client.db("LargeProject");
  const user = await db.collection('users').find({_id: o_id}).toArray();

  if(user.length>0)
  {
    const result = await db.collection('ingredients').find({ingredient: ingName}).toArray();

    if(result.length>0)
    {
      const add = await db.collection('users').updateOne({_id:user[0]._id}, {$addToSet:{bar:ingName}});
      const updated = await db.collection('users').find({_id: o_id}).toArray();
      res.status(200).json(updated[0]);
    }
    else
    {
      var ret = {error: 'ingredient not found'};
      res.status(200).json(ret);
    
    }
  }
  else{
    var ret = {error: 'user not found'};
    res.status(200).json(ret);
  }
  
});

app.delete('/api/deleteIngredientInBar', async (req, res, next) => 
{
  // incoming: search
  // outgoing: results[], error
  var error = '';
  const { userId, ingName } = req.body;
  var o_id = new mongo.ObjectId(userId);
  
  const db = client.db("LargeProject");
  const user = await db.collection('users').find({_id: o_id}).toArray();

  if(user.length>0)
  {
    const result = await db.collection('ingredients').find({ingredient: ingName}).toArray();

    if(result.length>0)
    {
      const add = await db.collection('users').updateOne({_id:user[0]._id}, {$pull:{bar:ingName}});
      const updated = await db.collection('users').find({_id: o_id}).toArray();
      res.status(200).json(updated[0]);
    }
    else
    {
      var ret = {error: 'ingredient not found'};
      res.status(200).json(ret);
    
    }
  }
  else{
    var ret = {error: 'user not found'};
    res.status(200).json(ret);
  }
  
});

app.listen(5000); // start Node + Express server on port 5000