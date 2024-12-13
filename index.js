const express = require('express')
const app = express()
const cors = require('cors')

require('dotenv').config({ path: "./sample.env" });
let mongoose = require('mongoose');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
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
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});
//Schema
const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique:true
  },
  username: { type: String, required: true },
});
 const User = mongoose.model('User', userSchema);

 const exerciseSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique:true
  },
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
  console.log("HERE",req.body);
  
  const { name:username } = req.body;
  
  try {
    let name = await User.findOne({ username });
    if (name) {
      res.json({ username, _id});
    } else {
      const _id = Math.random().toString(36).substring(2, 8);

      name = new User({
        username:name,
        _id});

      await name.save();
      res.json({ username, _id });
      console.log("post successful");
      }
    } catch (err) {
      console.log(err);
      res.status(500).json('Server Error');
    }
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
