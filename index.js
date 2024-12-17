const express = require('express')
const app = express()
const cors = require('cors')

require('dotenv').config({ path: "./sample.env" });
let mongoose = require('mongoose');
const bodyParser = require('body-parser');
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }) .then(() => {
  console.log('Connected to Mongo!');
})
.catch((err) => {
  console.error('Error connecting to Mongo', err);
});
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url, req.query);
  next();
});
app.use((err, req, res, next) => {
  console.error("Middleware error:", err);
  res.status(500).json({ error: "Middleware error" });
});
//Schema
const userSchema = new mongoose.Schema({
 
  username: { type: String, required: true },
});
 const User = mongoose.model('User', userSchema);

 const exerciseSchema = new mongoose.Schema({

  username: { type: String, required: true },
  duration: {
    type:Number,
    required:true
  },
  date: Date,
  description:{
    type:String,
    required:true
  }
});
 const Exercise = mongoose.model('Exercise', exerciseSchema);

//Post
app.post("/api/users", async (req, res) => {
  console.log("request body:",req.body);
  
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" }); // Handle missing username
  }
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.json({ username: user.username, _id: user._id });
    } else {
      user = new User({
        username});

      await user.save();
     
      res.json({ username: user.username, _id: user._id });
      console.log("User created successfully");
      
      }
    } catch (err) {
      console.log(err);
      res.status(500).json('Server Error');
    }
  
});
app.use(express.json());
app.post("/api/users/:_id/exercises", async (req, res) => {
  console.log("request body:",req.body);
  console.log("request.body._id:", req.body._id);
  console.log("req.params:", req.params);
 
 
    const { id } =  req.params;
    console.log(req.params);
    const userFound = await User.findById(req.params);
    console.log(id);
    try{
    if (!userFound) {
      return res.status(404).json({ error: "User not found" });
    }
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: "Description and duration are required" });
    }

    const parsedDate = date ? new Date(date) : new Date();

    // Save the exercise to the database
    const exercise = new Exercise({
      username: userFound.username,
      description,
      duration: Number(duration),
      date: parsedDate,
    });

    await exercise.save();
  
    res.json({
      username: userFound.username,
      _id: userFound._id,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Server Error");
  }
});

//Get
app.get("/api/users", async function(req, res) {
  const  users= await User.find();
  res.json(users);
});



app.get("/api/users/:_id/logs", async function (req, res) {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Debugging to check incoming query parameters
    console.log("Query params:", req.query);

    // Find the user by ID
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare the query for the logs
    let query = { username: user.username };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    console.log(query)
    // Fetch and optionally limit the logs
    let logs = await Exercise.find(query, "description duration date")
      .sort("date")
      .limit(limit ? parseInt(limit) : 0)
      .exec();

    // Format the logs for response
    logs = logs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toDateString(),
    }));

    // Build the response object
    let response = {
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs,
    };

    // Include `from` and `to` only if provided
    if (from) {
      response.from = new Date(from).toDateString();
    }
    if (to) {
      response.to = new Date(to).toDateString();
    }

    // Debugging the final response before sending
    console.log("Final response:", response);

    res.json(response);
  } catch (error) {
    console.error("Error handling /api/users/:_id/logs:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
