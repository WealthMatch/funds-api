const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const packageRoutes = require('./routes/packageRoutes');
// const siteDataRoutes = require('./routes/siteDataRoutes');
const cors = require('cors');

const app = express();
// const port = process.env.PORT || 7000;

// app.use(cors());


// Middleware
// app.use(bodyParser.json());

app.use(cors('*'))

app.use(cors());

app.use(express.json());

// Connect to MongoDB

app.get('/', (req, res) => {
  res.send('Hey API running 🥳')
})

app.use("/status",(req,res) => {
  res.send({status: "OK"});
})

// Routes
// app.use('/auth', authRoutes);
app.use(investmentRoutes);
app.use(packageRoutes);
// app.use('/site-data', siteDataRoutes);


// mongodb+srv://root:icui4cumise7@cluster0.3o7ko.mongodb.net/finance
// mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));
  mongoose.connect(process.env.DATABASE_URL, { useUnifiedTopology: true, useNewUrlParser: true,}, (err,res) => {
    if(err){
        console.log(err)
    }
    else{
      console.log('Connected to Database');
    }
});
mongoose.set('useFindAndModify', true);

app.listen(8070, () => {
  console.log(`Server is running on port ${port}`);
});
