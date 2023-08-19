const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const authRoutes = require('./routes/authRoutes');
// const investmentRoutes = require('./routes/investmentRoutes');
// const packageRoutes = require('./routes/packageRoutes');
// const siteDataRoutes = require('./routes/siteDataRoutes');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 7000;

app.use(cors());


// Middleware
app.use(bodyParser.json());

// Connect to MongoDB

app.get('/', (req, res) => {
  res.send('Hey API running 🥳')
})

app.use("/status",(req,res) => {
  res.send({status: "OK"});
})

// mongodb+srv://root:icui4cumise7@cluster0.3o7ko.mongodb.net/finance
// mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// Routes
// app.use('/auth', authRoutes);
// app.use('/investment', investmentRoutes);
// app.use('/package', packageRoutes);
// app.use('/site-data', siteDataRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
