const Investment = require('../models/Investment');
const Merge = require('../models/Merge');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const secretKey = 'your-secret-key';


exports.createInvestment = async (req, res) => {
  try {
    const { amountInvested } = req.body;
    const amountExpected = amountInvested * 1.5; // 50% increase


    let pendingInvestment = await Investment.find({status: { $in: ['merged','pending-merge'] }, user: req.userId });

    if(pendingInvestment.length > 0) {
      return res.status(500).send({message: "Complete Existing Investment"})
    }

    const newInvestment = new Investment({
      user: req.userId,
      amountInvested,
      amountExpected,
    });

    await newInvestment.save();

    res.status(201).json({ message: 'Investment created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating investment' });
  }
};

exports.getAllPendingMerge = async(req,res) => {
  try {

    let investments = await Investment.find({ status: 'pending-merge' }).populate('user');

    return res.status(200).json({message: "Investments", investments: investments })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
}

exports.getPendingMergeToday = async(req,res) => {
  try {
    const currentDate = new Date();

    // Set the time of currentDate to midnight
    currentDate.setHours(0, 0, 0, 0);

    // Find all investments with dateInvested equal to currentDate and status 'pending-merge'
    const pendingMergeInvestments = await Investment.find({
      dateInvested: currentDate,
      status: 'pending-merge'
    });

    return res.status(200).json({ pendingMergeInvestments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while fetching pending-merge investments for today' });
  }
}

exports.getAllInvestments = async (req, res) => {
    try {
      const investments = await Investment.find();
      res.status(200).json({ investments });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching all investments' });
    }
  };
  

exports.mergeInvestments = async(req,res) => {
    try {
      const { investmentAId, investmentBId, amount } = req.body;
      // console.log(req.body);

      // Fetch investmentA and investmentB from the database
      const investmentA = await Investment.findOne({_id: investmentAId});
      const investmentB = await Investment.findOne({_id: investmentBId});
      
      // console.log('INV A: ',  investmentA);
      // console.log('INV A: ',  investmentB);

      if(!investmentB) {
        return  res.status(400).send({message: "Investment with ID not found"});
      }

      if(investmentB.status != 'pending-payment') {
        return  res.status(400).send({message: "Investment with ID not ready  for merge"});
      }

      // Check if investmentA has enough funds to merge
      const availableFunds = investmentA.amountInvested - investmentA.mergedToSendAmount;
      if (availableFunds < amount) {
        return res.status(400).json({ message: "Not enough funds to merge" });
      }

      //Check if adding amount is not sending investmen B receive  to more than expected
      const bReceiveFundsCheck = investmentB.mergedToReceiveAmount + amount;
      if(bReceiveFundsCheck > investmentB.amountExpected) {
        return res.status(400).json({ message: "Amount is more than what's expected " });
      }
  
      // Create a new merge record
      const newMerge = await Merge.create({
        investmentSending: investmentAId,
        investmentReceiving: investmentBId,
        amount: amount,
      });
  
      // Update investmentA's sendTo and investmentB's receiveFrom arrays
      investmentA.sendTo.push(newMerge._id);
      investmentB.receiveFrom.push(newMerge._id);
  
      // Update mergedToSend and mergedToReceive values
      investmentA.mergedToSendAmount += amount;
      investmentB.mergedToReceiveAmount += amount;
  
      if(investmentB.mergedToReceiveAmount > investmentB.amountExpected) {
        return res.status(400).send('Amount Is More Than Expected');
      }

      // Check if investmentA's mergeToSendAmount is equal to amountInvested
      if (investmentA.mergedToSendAmount === investmentA.amountInvested) {
        investmentA.mergedToSendComplete = true;
        investmentA.status = 'merged';
      }
  
      // Check if investmentB's mergedToReceiveAmount is equal to amountExpected
      if (investmentB.mergedToReceiveAmount === investmentB.amountExpected) {
        investmentB.mergedToReceiveComplete = true;
        investmentB.status = 'awaiting-payment';
      }
  
      // Save the changes to both investments
      await investmentA.save();
      await investmentB.save();
  
      return res.status(200).json({ message: "Investments merged successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An error occurred while merging investments" });
    }
}

  exports.cancelMerge = async(req,res) => {
    try {
      const mergeId = req.params.mergeId;
  
      // Update the status of the merge to 'failed'
      const updatedMerge = await Merge.findByIdAndUpdate(mergeId, { status: 'failed' }, { new: true });
  
      // Retrieve the investmentReceiving based on investmentSending of the merge
      const investmentReceivingId = updatedMerge.investmentReceiving;
      const investmentReceiving = await Investment.findById(investmentReceivingId);
  
      // Find the mergeId in the receiveFrom array of the investment
      const mergeIndex = investmentReceiving.receiveFrom.indexOf(mergeId);
  
      // If the mergeId is found in the receiveFrom array, remove it
      if (mergeIndex !== -1) {
        investmentReceiving.receiveFrom.splice(mergeIndex, 1);
  
        // Subtract the merge amount from mergeToReceiveAmount
        investmentReceiving.mergedToReceiveAmount -= updatedMerge.amount;
  
        // Update the mergeToReceiveComplete and status of the investment
        investmentReceiving.mergedToReceiveComplete = false;
        investmentReceiving.status = 'pending-payment';
  
        // Save the changes to the investmentReceiving
        await investmentReceiving.save();
      }
  
      return res.status(200).json({ message: "Merge canceled successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An error occurred while canceling the merge" });
    }
  }

exports.getInvestmentsByPendingPayment = async (req, res) => {
    try {
      //Get Admin  Accounts
      const adminUsers = await User.find({ cmp: true }).select('_id');
    // Extract admin user IDs
    const adminUserIds = adminUsers.map((user) => user._id);


      // Get the current date
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set time to start of the day
  
      // Find all investments with dateToReceive as the current date and status as 'pending-payment'
      const pendingPaymentInvestments = await Investment.find({
        // dateToReceive: currentDate,
        user: { $nin: adminUserIds },
        status: 'pending-payment'
      }).populate('user').populate('sendTo').populate('receiveFrom');
      
      let filteredData = pendingPaymentInvestments.filter((data) => data.user !== null);

      return res.status(200).json({ investments: filteredData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An error occurred while fetching pending payment investments" });
    }
};


exports.getInvestmentsWithStatusAwaitingPayment = async (req, res) => {
  try {
    //Get Admin  Accounts
    const adminUsers = await User.find({ cmp: true }).select('_id');
  // Extract admin user IDs
  const adminUserIds = adminUsers.map((user) => user._id);


    // Get the current date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set time to start of the day

    // Find all investments with dateToReceive as the current date and status as 'awaiting-payment'
    const awaitingPaymentInvestments = await Investment.find({
      // dateToReceive: currentDate,
      user: { $nin: adminUserIds },
      status: 'awaiting-payment'
    }).populate('user').populate('sendTo').populate('receiveFrom');

    return res.status(200).json({ investments: awaitingPaymentInvestments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching pending payment investments" });
  }
};

exports.getCompletedInvestments = async(req,res) =>  {
  try {
    // Find all investments with status 'paid'
    const paidInvestments = await Investment.find({ status: 'paid' }).populate('user').populate('sendTo').populate('receiveFrom');

    return res.status(200).json({ paidInvestments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching paid investments" });
  }
}


exports.deleteInvestment = async (req, res) => {
    try {
      const { investmentId } = req.params;
  
      // Find the investment to be deleted
      const investment = await Investment.findById(investmentId);
  
      if (!investment) {
        return res.status(404).json({ message: 'Investment not found' });
      }
  
      // Update sendTo investment (if exists)
      if (investment.sendTo) {
        const sendToInvestment = await Investment.findByIdAndUpdate(
          investment.sendTo,
          { $pull: { receiveFrom: investmentId } },
          { new: true }
        );
      }
  
      // Delete the investment
      await Investment.findByIdAndDelete(investmentId);
  
      res.status(200).json({ message: 'Investment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting investment' });
    }
};


exports.createAdminInvestment  = async(req,res) => {
  try {
    const { user, amountInvested, amountExpected, }  = req.body; 

    let investment = new  Investment({
      user,
      amountInvested,
      amountExpected,
      mergedToSendAmount: amountInvested,
      mergedToSendComplete: true,
      amountSent: amountInvested,
      status: 'pending-payment'
    })

    await investment.save();

    return res.status(201).send({message: "Investment Created"});

  } catch (error) {
    res.status(500).json({ message: 'Error creating Investment' });
  }

};



// MERGE ADMIN TO PAY USER
exports.mergeAdminToPayUser  = async(req,res) => {
    try {
      let { adminId, amount,  investmentBId } = req.body;

      const newInvestment = new Investment({
        user: adminId,
        amountInvested: amount,
        amountExpected: amount * 1.5,
      });

      const savedInvestment = await newInvestment.save();
      const investmentAId = savedInvestment._id;

      // USE ADMIN ID TO CREATE INVESTMENT WITH AMOUNT THAT WAS SENT  AND USE AS THE INVESTMENT 

      // Fetch investmentA and investmentB from the database
      const investmentA = await Investment.findOne({_id: investmentAId});
      const investmentB = await Investment.findOne({_id: investmentBId});
      
      // console.log('INV A: ',  investmentA);
      // console.log('INV A: ',  investmentB);

      if(!investmentB) {
        return  res.status(400).send({message: "Investment with ID not found"});
      }

      if(investmentB.status != 'pending-payment') {
        return  res.status(400).send({message: "Investment with ID not ready  for merge"});
      }

      // Check if investmentA has enough funds to merge
      const availableFunds = investmentA.amountInvested - investmentA.mergedToSendAmount;
      if (availableFunds < amount) {
        return res.status(400).json({ message: "Not enough funds to merge" });
      }

      //Check if adding amount is not sending investmen B receive  to more than expected
      const bReceiveFundsCheck = investmentB.mergedToReceiveAmount + amount;
      if(bReceiveFundsCheck > investmentB.amountExpected) {
        return res.status(400).json({ message: "Amount is more than what's expected " });
      }
  
      // Create a new merge record
      const newMerge = await Merge.create({
        investmentSending: investmentAId,
        investmentReceiving: investmentBId,
        amount: amount,
      });
  
      // Update investmentA's sendTo and investmentB's receiveFrom arrays
      investmentA.sendTo.push(newMerge._id);
      investmentB.receiveFrom.push(newMerge._id);
  
      // Update mergedToSend and mergedToReceive values
      investmentA.mergedToSendAmount += amount;
      investmentB.mergedToReceiveAmount += amount;
  
      if(investmentB.mergedToReceiveAmount > investmentB.amountExpected) {
        return res.status(400).send('Amount Is More Than Expected');
      }

      // Check if investmentA's mergeToSendAmount is equal to amountInvested
      if (investmentA.mergedToSendAmount === investmentA.amountInvested) {
        investmentA.mergedToSendComplete = true;
        investmentA.status = 'merged';
      }
  
      // Check if investmentB's mergedToReceiveAmount is equal to amountExpected
      if (investmentB.mergedToReceiveAmount === investmentB.amountExpected) {
        investmentB.mergedToReceiveComplete = true;
        investmentB.status = 'awaiting-payment';
      }
  
      // Save the changes to both investments
      await investmentA.save();
      await investmentB.save();
  
      return res.status(200).json({ message: "Investments merged successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An error occurred while merging admin investments" });
    }
}

//GET ADMIN TO PAY INVESTMENTS
exports.getAdminPendingSendPayInvestments =  async(req,res) => {
  try {
    const adminUsers = await User.find({ cmp: true }).select('_id');
    // Extract admin user IDs
    const adminUserIds = adminUsers.map((user) => user._id);

    // const adminInvestments = await Investment.find({ user: { $in: adminUserIds }, status: {  $in: ['pending-payment','merged']} });

    // Get all merge IDs from the receiveFrom arrays of user investments
    // const mergeIds = adminInvestments.reduce((ids, investment) => ids.concat(investment.sendTo), []);

    // Find all pending merges with the IDs from the user's investments
    const adminInvestments = await Investment.find({ user: { $in: adminUserIds }, status: 'merged' }).populate({
      path: 'sendTo',
      populate: {
        path: 'investmentSending investmentReceiving',
        populate: {
          path: 'user', // Populate user property inside investmentSending and investmentReceiving
        }
      },
    });


    const mergedSendTo = [];

    // Loop through userInvestments
    adminInvestments.forEach((investment) => {
      // Filter objects with status other than 'done' and push into mergedSendTo
      investment.sendTo.forEach((sendTobj) => {
        if (sendTobj.status !== 'done') {
          mergedSendTo.push(sendTobj);
        }
      });

      // Clear investment.sendTo array
      investment.sendTo = [];
    });

    return res.status(200).json({ sends: mergedSendTo });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching user's pending merges" });
  }
}

//GET ADMIN TO RECEIVE INVESTMENTS
exports.getAdminPendingReceivePayInvestments =  async(req,res) => {
  try {
    const adminUsers = await User.find({ cmp: true }).select('_id');
    // Extract admin user IDs
    const adminUserIds = adminUsers.map((user) => user._id);

    // const adminInvestments = await Investment.find({ user: { $in: adminUserIds }, status: 'awaiting-payment' });

    // Get all merge IDs from the receiveFrom arrays of user investments
    // const mergeIds = adminInvestments.reduce((ids, investment) => ids.concat(investment.receiveFrom), []);

    // Find all pending merges with the IDs from the user's investments
    // const adminPendingSendMerges = await Merge.find({ _id: { $in: mergeIds }, status: 'pending' }).populate('investmentSending').populate('investmentReceiving');

    const adminInvestments = await Investment.find({ user: { $in: adminUserIds }, status: {$in: ['awaiting-payment','pending-payment']} }).populate({
      path: 'receiveFrom',
      populate: {
        path: 'investmentSending investmentReceiving',
        populate: {
          path: 'user', // Populate user property inside investmentSending and investmentReceiving
        }
      },
    });

    const mergedReceiveFrom = [];

    // // Loop through userInvestments
    // adminInvestments.forEach((investment) => {
    //   // Filter objects with status other than 'done' and push into mergedReceiveFrom
    //   investment.receiveFrom.forEach((receiveFromObj) => {
    //     if (receiveFromObj.status !== 'done') {
    //       mergedReceiveFrom.push(receiveFromObj);
    //     }
    //   });

    //   // Clear investment.receiveFrom array
    //   investment.receiveFrom = [];
    // });

        // Loop through userInvestments
    adminInvestments.forEach((investment) => {
      // Filter objects with status other than 'done' and push into mergedReceiveFrom
      investment.receiveFrom.forEach((receiveFromObj) => {
        if (receiveFromObj.status !== 'done' && receiveFromObj.investmentSending?.status != 'pending-payment' && receiveFromObj?.investmentSending != null) {
          mergedReceiveFrom.push(receiveFromObj);
   
          // console.log('RECEIVEE  FROM OBJ: ', receiveFromObj.investmentSending);
        }
      });

      // Clear investment.receiveFrom array
      investment.receiveFrom = [];
    });
    
    return res.status(200).json({ receives: mergedReceiveFrom });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching user's pending merges" });
  }
}

//

exports.getAdminInvestMentsPendingPayment = async(req,res) => {
  try {
    // Find all admin users
    const adminUsers = await User.find({ cmp: true }).select('_id');

    // Extract admin user IDs
    const adminUserIds = adminUsers.map((user) => user._id);

    // Find investments where user ID is among admin user IDs
    const adminInvestments = await Investment.find({
      user: { $in: adminUserIds },
      status: 'pending-payment'
    }).populate('user');

    res.json({ investments: adminInvestments });

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.getAdminInvestMentsAwaitingPayment = async(req,res) => {
  try {
    // Find all admin users
    const adminUsers = await User.find({ cmp: true }).select('_id');

    // Extract admin user IDs
    const adminUserIds = adminUsers.map((user) => user._id);

    // Find investments where user ID is among admin user IDs
    const adminInvestments = await Investment.find({
      user: { $in: adminUserIds },
      status: 'awaiting-payment'
    }).populate('user');

    res.json({ investments: adminInvestments });

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.createAdminProfile = async(req,res) => {
  try {
    const { firstName, lastName, email, paymentNumber, paymentType, whatsappNumber, referredBy  } = req.body;

    let password = '123456';

    const referralCode = generateReferralCode();

    console.log("DATA: ",req.body);

    // Hash the password
    // console.log('PASSWORD: ', password)
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.findOne({email: email});

    if(user) {
        return res.status(500).send({message: 'User Already Exist'})
    }

    const newUser = new User({
      firstName,
      lastName,
      email, 
      whatsappNumber,
      paymentNumber,
      paymentType,
      password: hashedPassword,
      referralCode,
      paymentNumber,
      paymentType,
      totalReferrals: 0,
      referralsAmount: 0,
      referredBy,
      cmp: true
    });

    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, secretKey, { expiresIn: '1h' });

    res.status(201).json({ token, user: newUser, message: 'Account created successfully' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating profile' });
  }
}

exports.getAllAdminAccounts = async(req,res) =>  {
  try {
    let accounts = await User.find({ cmp: true });

    return res.status(200).send({ accounts: accounts });
  } catch (error) {
    res.status(500).json({ message: 'Error getting accounts' });
  }
}


exports.unMergeAndDeleteAllUsersInvestments = async (req, res) => {
  try {
    const userId = req.body.userId;

    // Get all user investments
    const userInvestments = await Investment.find({ user: userId }).populate('sendTo');

    // Iterate through each user investment
    for (const investment of userInvestments) {
      // Iterate through the sendTo array to process each merge
      for (const mergeId of investment.sendTo) {
        // Populate the merge
        const populatedMerge = await Merge.findById(mergeId);

       if(populatedMerge?.status != 'done') {
         // Take the amount of the merge and deduct it from investmentReceiving -> mergedToReceiveAmount
         const investmentReceiving = await Investment.findById(populatedMerge.investmentReceiving);
         investmentReceiving.mergedToReceiveAmount -= populatedMerge.amount;
 
         // Change investmentReceiving -> mergedToReceiveComplete to false
         investmentReceiving.mergedToReceiveComplete = false;
 
         // Change investmentReceiving -> status back to pending-payment
         investmentReceiving.status = 'pending-payment';
 
         // Remove userId from investmentReceiving -> receiveFrom array
         const index = investmentReceiving.receiveFrom.indexOf(userId);
         if (index !== -1) {
           investmentReceiving.receiveFrom.splice(index, 1);
         }
 
         // Save the updated investmentReceiving
         await investmentReceiving.save();
 
         // Remove the merge from sendTo array
         const mergeIndex = investment.sendTo.indexOf(mergeId);
         if (mergeIndex !== -1) {
           investment.sendTo.splice(mergeIndex, 1);
         }
       }

        // Save the updated investment
        await investment.save();
      }
    }

    // Delete all user investments
    await Investment.deleteMany({ user: userId });

    await User.findOneAndUpdate({_id: userId}, {status: 'Suspended'});

    return res.status(200).json({ message: 'All user investments have been unmerged and deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// USSER

exports.getUserSendToInvestMents  = async(req,res) => {
  const userId = req.userId;

  try {
    // Find user investments and populate required fields
    const userInvestments = await Investment.find({ user: userId, status: { $ne: 'paid' } })
      .populate({
        path: 'sendTo',
        populate: {
          path: 'investmentSending investmentReceiving',
          populate: {
            path: 'user', // Populate user property inside investmentSending and investmentReceiving
          }
        },
      });

    // Remove objects from sendTo arrays and create a new array
    // const mergedSendTo = [];
    // userInvestments.forEach((investment) => {
    //   mergedSendTo.push(...investment.sendTo);
    //   investment.sendTo = [];
    // });

    const mergedSendTo = [];

    // Loop through userInvestments
    userInvestments.forEach((investment) => {
      // Filter objects with status other than 'done' and push into mergedSendTo
      investment.sendTo.forEach((sendTobj) => {
        if (sendTobj.status !== 'done') {
          mergedSendTo.push(sendTobj);
        }
      });

      // Clear investment.sendTo array
      investment.sendTo = [];
    });

    res.json({ sends: mergedSendTo });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.getUserReceiveFromInvestMents  = async(req,res) => {
  const userId = req.userId;

  try {
    // Find user investments and populate required fields
    const userInvestments = await Investment.find({ user: userId, status: { $ne: 'paid' } })
      .populate({
        path: 'receiveFrom',
        populate: {
          path: 'investmentSending investmentReceiving',
          populate: {
            path: 'user', // Populate user property inside investmentSending and investmentReceiving
          }
        },
      })
    // Remove objects from receiveFrom arrays and create a new array
    // const mergedReceiveFrom = [];
    // userInvestments.forEach((investment) => {
    //   mergedReceiveFrom.push(...investment.receiveFrom);
    //   investment.receiveFrom = [];
    // });

      // Create a new array to store filtered receiveFrom objects
      const mergedReceiveFrom = [];

      // Loop through userInvestments
      userInvestments.forEach((investment) => {
        // Filter objects with status other than 'done' and push into mergedReceiveFrom
        investment.receiveFrom.forEach((receiveFromObj) => {
          if (receiveFromObj.status !== 'done') {
            mergedReceiveFrom.push(receiveFromObj);
          }
        });
  
        // Clear investment.receiveFrom array
        investment.receiveFrom = [];
      });

    res.json({ receives: mergedReceiveFrom });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


exports.getAllUserPendingInvestment = async (req,res) => {
  try {
    let userId = req.userId;

    let investments = await Investment.find({user: userId, status: { $ne: 'paid' }});

    return res.status(200).send({ investments: investments });
  } catch (error) {
    
  }
}

exports.getAllUserDoneInvestment = async (req,res) => {
  try {
    let userId = req.userId;

    let investments = await Investment.find({user: userId, status: 'paid'}).populate('user');

    return res.status(200).send({ investments: investments });
  } catch (error) {
    
  }
}

// exports.updateReceiveStatus = async (req, res) => {
//   try {
//     const mergeId = req.params.mergeId;

//     // Update sendStatus and receiveStatus to 'sent' and 'received' for the specified merge
//     const updatedMerge = await Merge.findByIdAndUpdate(mergeId, { receiveStatus: 'received' }, { new: true });

//     // Check if both sendStatus and receiveStatus are 'sent' and 'received'
//     if (updatedMerge.sendStatus === 'sent' && updatedMerge.receiveStatus === 'received') {
//       // Update the investmentSending amountSent
//       const investmentA = await Investment.findById(updatedMerge.investmentSending);
//       investmentA.amountSent += updatedMerge.amount;

//       //Update Merge Status to Done
//       await Merge.findByIdAndUpdate(mergeId, { status: 'done' });

//       // Check if amountSent equals amountInvested
//       if (investmentA.amountSent === investmentA.amountInvested) {
//         investmentA.status = 'pending-payment';

//           // Calculate the date 5 days from the current date
//         const currentDate = new Date();
//         const dateToReceive = new Date(currentDate);
//         dateToReceive.setDate(dateToReceive.getDate() + 5);

//         // Update the dateToReceive of investmentA
//         investmentA.dateToReceive = dateToReceive;
//       }

//       // Update the investmentReceiving amountReceived
//       const investmentB = await Investment.findById(updatedMerge.investmentReceiving);
//       investmentB.amountReceived += updatedMerge.amount;

//       // Check if amountReceived equals amountExpected
//       if (investmentB.amountReceived === investmentB.amountExpected) {
//         investmentB.status = 'paid';
//       }

//       // Save the changes to both investments
//       await investmentA.save();
//       await investmentB.save();
//     }

//     return res.status(200).json({ message: "Receive status updated successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "An error occurred while updating  receive status" });
//   }
// };
exports.updateReceiveStatus = async (req, res) => {
  try {
    const mergeId = req.params.mergeId;

    // Update sendStatus and receiveStatus to 'sent' and 'received' for the specified merge
    const updatedMerge = await Merge.findByIdAndUpdate(mergeId, { receiveStatus: 'received' }, { new: true });

    // Check if both sendStatus and receiveStatus are 'sent' and 'received'
    if (updatedMerge.sendStatus === 'sent' && updatedMerge.receiveStatus === 'received') {
      // Update the investmentSending amountSent
      const investmentA = await Investment.findById(updatedMerge.investmentSending).populate('user');;
      investmentA.amountSent += updatedMerge.amount;

      //Update Merge Status to Done
      await Merge.findByIdAndUpdate(mergeId, { status: 'done' });

      // Check if amountSent equals amountInvested
      if (investmentA.amountSent === investmentA.amountInvested) {

        if(investmentA.user.cmp) {
          investmentA.status = 'admin-paid';
        }else {
          investmentA.status = 'pending-payment';

          if(investmentA.user.referredBy) {
            let bonus = investmentA.amountInvested * 0.1;
            let referralOwner = await User.findOne({referralCode: investmentA.user.referredBy });
           
            await User.findOneAndUpdate({referralCode: investmentA.user.referredBy }, { referralsAmount: referralOwner.referralsAmount += bonus});
          }
        }

          // Calculate the date 5 days from the current date
        const currentDate = new Date();
        const dateToReceive = new Date(currentDate);
        dateToReceive.setDate(dateToReceive.getDate() + 5);

        // Update the dateToReceive of investmentA
        investmentA.dateToReceive = dateToReceive;
      }

      // Update the investmentReceiving amountReceived
      const investmentB = await Investment.findById(updatedMerge.investmentReceiving);
      investmentB.amountReceived += updatedMerge.amount;

      // Check if amountReceived equals amountExpected
      if (investmentB.amountReceived === investmentB.amountExpected) {
        investmentB.status = 'paid';
      }

      // Save the changes to both investments
      await investmentA.save();
      await investmentB.save();
    }

    return res.status(200).json({ message: "Receive status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while updating  receive status" });
  }
};

// exports.updateSendStatus = async (req, res) => {
//   try {
//     const mergeId = req.params.mergeId;

//     // Update sendStatus and receiveStatus to 'sent' and 'received' for the specified merge
//     const updatedMerge = await Merge.findByIdAndUpdate(mergeId, { sendStatus: 'sent' }, { new: true });

//     // Check if both sendStatus and receiveStatus are 'sent' and 'received'
//     if (updatedMerge.sendStatus === 'sent' && updatedMerge.receiveStatus === 'received') {
//       // Update the investmentSending amountSent
//       const investmentA = await Investment.findById(updatedMerge.investmentSending).populate('user');
//       investmentA.amountSent += updatedMerge.amount;

//       // Check if amountSent equals amountInvested
//       if (investmentA.amountSent === investmentA.amountInvested) {
//         if(investmentA.user.cmp) {
//           investmentA.status = 'admin-paid';
//         }else {
//           investmentA.status = 'pending-payment';

//           if(investmentA.user.referredBy) {
//             let bonus = investmentA.amountInvested * 0.1;
//             let referralOwner = await User.findOne({_id: investmentA.user._id });
//             await User.findOneAndUpdate({_id: investmentA.user._id }, { referralsAmount: referralOwner.referralsAmount += bonus});
//           }
//         }
        
//         // Calculate the date 5 days from the current date
//         const currentDate = new Date();
//         const dateToReceive = new Date(currentDate);
//         dateToReceive.setDate(dateToReceive.getDate() + 5);

//         // Update the dateToReceive of investmentA
//         investmentA.dateToReceive = dateToReceive;
//       }

//       // Update the investmentReceiving amountReceived
//       const investmentB = await Investment.findById(updatedMerge.investmentReceiving);
//       investmentB.amountReceived += updatedMerge.amount;

//       // Check if amountReceived equals amountExpected
//       if (investmentB.amountReceived === investmentB.amountExpected) {
//         investmentB.status = 'paid';
//       }

//       // Save the changes to both investments
//       await investmentA.save();
//       await investmentB.save();
//     }

//     return res.status(200).json({ message: "Send status updated successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "An error occurred while updating send status" });
//   }
// };

exports.updateSendStatus = async (req, res) => {
  try {
    const mergeId = req.params.mergeId;

    // Update sendStatus and receiveStatus to 'sent' and 'received' for the specified merge
    const updatedMerge = await Merge.findByIdAndUpdate(mergeId, { sendStatus: 'sent' }, { new: true });

    // Check if both sendStatus and receiveStatus are 'sent' and 'received'
    if (updatedMerge.sendStatus === 'sent' && updatedMerge.receiveStatus === 'received') {
      // Update the investmentSending amountSent
      const investmentA = await Investment.findById(updatedMerge.investmentSending).populate('user');
      investmentA.amountSent += updatedMerge.amount;

      // Check if amountSent equals amountInvested
      if (investmentA.amountSent === investmentA.amountInvested) {
        if(investmentA.user.cmp) {
          investmentA.status = 'admin-paid';
        }else {
          investmentA.status = 'pending-payment';

          if(investmentA.user.referredBy) {
            let bonus = investmentA.amountInvested * 0.1;
            let referralOwner = await User.findOne({referralCode: investmentA.user.referredBy });
           
            await User.findOneAndUpdate({referralCode: investmentA.user.referredBy }, { referralsAmount: referralOwner.referralsAmount += bonus});
          }
        }
        
        // Calculate the date 5 days from the current date
        const currentDate = new Date();
        const dateToReceive = new Date(currentDate);
        dateToReceive.setDate(dateToReceive.getDate() + 5);

        // Update the dateToReceive of investmentA
        investmentA.dateToReceive = dateToReceive;
      }

      // Update the investmentReceiving amountReceived
      const investmentB = await Investment.findById(updatedMerge.investmentReceiving);
      investmentB.amountReceived += updatedMerge.amount;

      // Check if amountReceived equals amountExpected
      if (investmentB.amountReceived === investmentB.amountExpected) {
        investmentB.status = 'paid';
      }

      // Save the changes to both investments
      await investmentA.save();
      await investmentB.save();
    }

    return res.status(200).json({ message: "Send status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while updating send status" });
  }
};

exports.getUserPendingReceiveMergePayments = async (req,res) => {
  try {
    const userId = req.userId;

    // Find all investments belonging to the user
    const userInvestments = await Investment.find({ user: userId, status: 'awaiting-payment' });

    // console.log("INVESTMENTS", userInvestments)
    // Get all merge IDs from the receiveFrom arrays of user investments
    const mergeIds = userInvestments.reduce((ids, investment) => ids.concat(investment.receiveFrom), []);

    // Find all pending merges with the IDs from the user's investments
    const userPendingMerges = await Merge.find({ _id: { $in: mergeIds }, status: 'pending' }).populate('investmentSending').populate('investmentReceiving');

    // console.log('DATA: ', userPendingMerges);

    return res.status(200).json({ receives: userPendingMerges });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching user's pending merges" });
  }
}

exports.getUserPendingSendMergePayments = async (req,res) => {
  try {
    const userId = req.userId;

    // Find all investments belonging to the user
    const userInvestments = await Investment.find({ user: userId, status: 'pending-payment' });

    // Get all merge IDs from the receiveFrom arrays of user investments
    const mergeIds = userInvestments.reduce((ids, investment) => ids.concat(investment.sendTo), []);

    // Find all pending merges with the IDs from the user's investments
    const userPendingSendMerges = await Merge.find({ _id: { $in: mergeIds }, status: 'pending' }).populate('investmentSending').populate('investmentReceiving');

    // console.log('DATA SEND: ', userPendingSendMerges);

    return res.status(200).json({ sends: userPendingSendMerges });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching user's pending merges" });
  }
}

exports.getDoneMergePayments = async(req,res) => {
  try {
    const userId = req.userId;

    // Find all investments belonging to the user with status 'paid'
    const userPaidInvestments = await Investment.find({ user: userId, status: 'paid' });

    // Get all merge IDs from the receiveFrom arrays of user's paid investments
    const mergeIds = userPaidInvestments.reduce((ids, investment) => ids.concat(investment.receiveFrom), []);

    // Find all done merges with the IDs from the user's paid investments
    const userDoneMerges = await Merge.find({ _id: { $in: mergeIds }, status: 'done' }).populate('investmentSending').populate('investmentReceiving');

    return res.status(200).json({ userDoneMerges });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while fetching user's done merges associated with paid investments" });
  }
}


  // Helper function to generate a random referral code
  function generateReferralCode() {
    // Logic to generate a referral code, you can customize as needed
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeLength = 8;
    let referralCode = '';
    for (let i = 0; i < codeLength; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return referralCode;
  }
