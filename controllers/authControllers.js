const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Admin = require('../models/Admin');
const Investment = require('../models/Investment');
const secretKey = 'your-secret-key';
const Withdrawal  =  require('../models/Withdrawal');

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, whatsappNumber, paymentNumber, referredBy, paymentType, password } = req.body;

    const referralCode = generateReferralCode();

    console.log("DATA: ",req.body);

    // Hash the password
    console.log('PASSWORD: ', password)
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.findOne({email: email});

    if(referredBy) {
      let referredUserData = await User.findOne({referralCode: referredBy})

      await User.findOneAndUpdate({referralCode: referredBy }, { totalReferrals: referredUserData.totalReferrals+= 1});
    }

    if(user) {
        return res.status(500).send({message: 'User Already Exist'})
    }

    const newUser = new User({
      firstName,
      lastName,
      email, 
      whatsappNumber,
      paymentNumber,
      password: hashedPassword,
      referralCode,
      paymentType,
      totalReferrals: 0,
      referralsAmount: 0,
      referredBy,
      cmp: false
    });

    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, secretKey, { expiresIn: '1h' });

    res.status(201).json({ token, user: newUser, message: 'User created successfully' });

    // res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// exports.signin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({ message: 'Authentication failed' });
//     }

//     const passwordMatch = bcrypt.compareSync(password, user.password);

//     if (!passwordMatch) {
//       return res.status(401).json({ message: 'Authentication failed' });
//     }

//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       secretKey,
//       { expiresIn: '24h' }
//     );

//     res.status(200).json({ accessToken: token, user: user });
//   } catch (error) {
//     res.status(500).json({ message: 'Error signing in' });
//   }
// };

// exports.updateUserPassword = async(req,res) => {
//   try {
//     let { newPassword } = req.body;

//     const hashedPassword = bcrypt.hashSync(newPassword, 10);

//     await User.findOneAndUpdate({_id: req.userId}, { password: hashedPassword })

//     return res.status(200).send({message: "Password Updated"});
//   } catch (error) {
//     return res.status(500).send({ message: "Error"});
//   }


// }


// exports.updateUserProfile = async(req, res) => {
//   try {
//     let { firstName, lastName, email, paymentNumber} = req.body;

//     await User.findOneAndUpdate({_id: req.userId}, { firstName, lastName, email, paymentNumber });

//     return res.status(200).send({message: "Data Updated"});
//   } catch (error) {
//     return res.status(500).send({ message: "Error"});
//   }
// }

// exports.getUserProfile = async(req, res) => {
//   try {
//     // console.log('ID: ', req.userId);

//     let user = await User.findOne({_id: req.userId});

//     if(!user)  {
//       return res.status(404).send({message: "User not found"})
//     }

//     // console.log(user);

//     return res.status(200).send({user: user});

//   } catch (error) {
//     return res.status(500).send({ message: "Error"});
//   }
// }

// exports.getUserEarnings = async(req,res) => {
//   try {

//     // Find all investments with status 'paid' for the given user
//     const userInvestments = await Investment.find({
//       user: req.userId,
//       status: 'paid'
//     });

//     // Calculate the sum of amountExpected from the user investments
//     const totalEarnings = userInvestments.reduce((total, investment) => {
//       return total + investment.amountExpected;
//     }, 0);

//     // PENDING PAY
//     const userPendingInvestments = await Investment.find({
//       user: req.userId,
//       status: { $in: ['awaiting-payment', 'pending-payment']}
//     });

//     const totalAwaiting = userPendingInvestments.reduce((total, investment) => {
//       return total + investment.amountExpected;
//     }, 0);

//     return res.json({
//       awaiting: totalAwaiting,
//       earnings: totalEarnings
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }

// exports.submitWithdrawalRequest = async(req,res) => {
//   try {
//     let userId = req.userId;
//     const { amount } = req.body;

//     const user = await User.findOne({_id: userId });

//     user.referralsAmount  -= amount;
//     await user.save();

//     let withdrawal = new Withdrawal({user: userId, amount:  amount});

//     await  withdrawal.save();

//     return res.status(200).send({ message: "Done" });
//   } catch (error) {
//     res.status(500).json({ message: 'Error' });
//   }
// }

// //ADMIN
// exports.adminSignup = async (req, res) => {
//   try {
//     const { firstName, lastName, email, whatsappNumber, paymentNumber, referredBy, paymentType, password } = req.body;

//     const referralCode = generateReferralCode();

//     console.log("DATA: ",req.body);

//     // Hash the password
//     console.log('PASSWORD: ', password)
//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const user = await Admin.findOne({email: email});

//     if(user) {
//         return res.status(500).send({message: 'User Already Exist'})
//     }

//     const newUser = new Admin({
//       firstName,
//       lastName,
//       email, 
//       whatsappNumber,
//       paymentNumber,
//       password: hashedPassword,
//       referralCode,
//       paymentType,
//       totalReferrals: 0,
//       referralsAmount: 0,
//       referredBy,
//       cmp: false
//     });

//     await newUser.save();

//     // Generate a JWT token
//     const token = jwt.sign({ userId: newUser._id, email: newUser.email }, secretKey, { expiresIn: '1h' });

//     res.status(201).json({ token, user: newUser, message: 'User created successfully' });

//     // res.status(201).json({ message: 'User created successfully' });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Error creating user' });
//   }
// };

// // Nevermind@123
// exports.adminSignin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log(req.body);
    
//     const user = await Admin.findOne({ email });

//     if (!user) {
//       return res.status(401).json({ message: 'Authentication failed' });
//     }

//     const passwordMatch = bcrypt.compareSync(password, user.password);

//     if (!passwordMatch) {
//       return res.status(401).json({ message: 'Authentication failed' });
//     }

//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       secretKey,
//       { expiresIn: '94h' }
//     );

//     res.status(200).json({ accessToken: token, user: user });
//   } catch (error) {
//     res.status(500).json({ message: 'Error signing in' });
//   }
// };

// exports.getAdminProfile = async(req, res) => {
//   try {
//     console.log('ID: ', req.userId);

//     let user = await Admin.findOne({_id: req.userId});

//     if(!user)  {
//       return res.status(404).send({message: "Admin not found"})
//     }

//     console.log(user);

//     return res.status(200).send({user: user});

//   } catch (error) {
//     return res.status(500).send({ message: "Error"});
//   }
// }

// exports.addPaymentInfo = async(req,res) => {
//   try {
//     // console.log(req.body);
//     let userId = req.userId;
//     const { paymentNumber, paymentType } = req.body;

//     let user =  await User.findOneAndUpdate({ _id: userId }, { paymentNumber, paymentType },  { new: true })

//     return res.status(200).send({user: user});

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Error adding' });
//   }
// }




// exports.getAllUsers = async (req, res) => {
//     try {
//       const users = await User.find();
//       res.status(200).json({ users });
//     } catch (error) {
//       res.status(500).json({ message: 'Error fetching all users' });
//     }
//   };

//   exports.suspendUser = async (req, res) => {
//     try {
//       const { userId } = req.params;
  
//       const user = await User.findByIdAndUpdate(
//         userId,
//         { status: 'Suspended' },
//         { new: true }
//       );
  
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       res.status(200).json({ message: 'User status changed to Suspended', user });
//     } catch (error) {
//       res.status(500).json({ message: 'Error suspending user' });
//     }
//   };


//   // Helper function to generate a random referral code
// function generateReferralCode() {
//     // Logic to generate a referral code, you can customize as needed
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     const codeLength = 8;
//     let referralCode = '';
//     for (let i = 0; i < codeLength; i++) {
//       referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
//     }
//     return referralCode;
//   }