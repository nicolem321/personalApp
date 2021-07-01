/*
  app.js -- This creates an Express webserver
*/

// First we load in all of the packages we need for the server...
const session = require("express-session");
//const bodyParser = require("body-parser");
const axios = require("axios");
var debug = require("debug")("personalapp:server");


const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

//const auth = require('./config/auth.js');



const mongoose = require( 'mongoose' );
//mongoose.connect( `mongodb+srv://${auth.atlasAuth.username}:${auth.atlasAuth.password}@cluster0-yjamu.mongodb.net/authdemo?retryWrites=true&w=majority`);
mongoose.connect( 'mongodb://localhost/authDemo');
//const mongoDB_URI = process.env.MONGODB_URI
//mongoose.connect(mongoDB_URI)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!")
});

const User = require('./models/User');

const authRouter = require('./routes/authentication');
const isLoggedIn = authRouter.isLoggedIn
const loggingRouter = require('./routes/logging');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
// Now we create the server
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(cors());

app.use(logger('dev'));
// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(authRouter);

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

//app.use(authRouter)
//app.use(loggingRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
// Here we enable session handling ..


const myLogger = (req,res,next) => {
  console.log('inside a route!')
  next()
}
//app.use(bodyParser.urlencoded({ extended: false }));

// This is an example of middleware
// where we look at a request and process it!
app.use(function(req, res, next) {
  //console.log("about to look for routes!!! "+new Date())
  console.log(`${req.method} ${req.url}`);
  //console.dir(req.headers)
  next();
});

// here we start handling routes
//main page
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/demo",
        function (req, res){res.render("demo");});

app.get("/about", (request, response) => {
  response.render("about");
});

app.get("/form", (request,response) => {
  response.render("form")
})

app.get("/dataDemo", (request,response) => {
  response.locals.name="Tim Hickey"
  response.locals.vals =[1,2,3,4,5]
  response.locals.people =[
    {'name':'Tim','age':65},
    {'name':'Yas','age':29}]
  response.render("dataDemo")
})

app.post("/showformdata", (request,response) => {
  response.json(request.body)
})

app.get('/socialize', (req,res)=>{
  res.render('socialize')
})

app.post('/socializeCard',(req,res)=>{
  const age = req.body.age
  const ageInDays = age*365
  res.locals.ageInDays = ageInDays
  res.locals.age = req.body.age
  res.locals.fullName = req.body.fullName
  res.locals.nickName = req.body.nickName
  res.locals.fact = req.body.fact
  res.locals.values = req.body.values
  res.render('socializeCard')

})

// Here is where we will explore using forms!


function seasonRank(a, b) {
  if (a.season<b.season) return -1;
  if (a.season>b.season) return 1;
  return 0;
}


// this example shows how to get the current US covid data
// and send it back to the browser in raw JSON form, see
// https://covidtracking.com/data/api
// for all of the kinds of data you can get
app.get("/recommendTV",
  async (req,res,next) => {
    try {
      const url = "http://api.tvmaze.com/schedule/web?date=2020-05-29&country=US"
      const result = await axios.get(url)
      const showsData = result.data.sort(seasonRank)
      console.log('showsData.length='+showsData.length)
      //res.json(covidData.reverse())
      res.locals.showsData = showsData
      res.render('tvSeries')
    } catch(error){
      next(error)
    }
})

// this shows how to use an API to get recipes
// http://www.recipepuppy.com/about/api/
// the example here finds omelet recipes with onions and garlic
app.get("/omelet",
  async (req,res,next) => {
    try {
      const url = "http://www.recipepuppy.com/api/?i=onions,garlic&q=omelet&p=3"
      const result = await axios.get(url)
      res.json(result.data)
    } catch(error){
      next(error)
    }
})
app.get('/learnCooking', (req,res) => {
  res.render('learnCooking')
})

app.post("/getRecipes",
  async (req,res,next) => {
    try {
      const food = req.body.food
      const url = "http://www.recipepuppy.com/api/?q="+food+"&p=1"
      const result = await axios.get(url)
      console.dir(result.data)
      console.log('results')
      console.dir(result.data.results)
      res.locals.results = result.data.results
      //res.json(result.data)
      res.render('showRecipes')
    } catch(error){
      next(error)
    }
})
let classesToTake = []

app.get('/classes', (req, res)=>{
  res.locals.classes = req.body.classes
  res.render('classes')
})

app.post('/getClasses',(req,res)=>{
  const classes = req.body.classes
  classesToTake = classesToTake.concat({'class': classes})
  console.log("Classes To Take")
  console.dir(classesToTake) //debug step
  res.locals.classesToTake = classesToTake
  res.render('showClasses')
})

app.get("/planner", async (req,res,next) => {
  res.render('planner')
})

const PlannerItem = require('./models/Planner')

app.post("/planners",
  //isLoggedIn,
  async (req,res,next) => {
    const month = req.body.month
    const week = req.body.week
    const createdAt = new Date
    const item = req.body.item
    const time = req.body.time
    const startTime = req.body.startTime
    const endTime = req.body.endTime
    const plannerdoc = new PlannerItem({
      //userId:req.user._id,
      month: month,
      week: week,
      createdAt: createdAt,
      item: item,
      time: time,
      startTime: startTime,
      endTime: endTime,
    })
    console.log("after initilizition")
    const result = await plannerdoc.save()
    console.log('result=')
    console.dir(result)
    res.locals.plannerItems = await PlannerItem.find({})
    res.render('planners')
})

app.get('/planners', //isLoggedIn,
  async (req,res,next) => {
    res.locals.plannerItems = await PlannerItem.find({})
    console.log('planners='+JSON.stringify(res.locals.plannerItems.length))
    res.render('planners')
  })

app.get('/plannerremove/:planner_id', //isLoggedIn,
    async (req,res,next) => {

      const planner_id = req.params.planner_id
      console.log(`id=${planner_id}`)
      await PlannerItem.deleteOne({_id:planner_id})
      res.redirect('/planners')

    })
// Don't change anything below here ...

// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//Here we set the port to use
const port = "5000";
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
