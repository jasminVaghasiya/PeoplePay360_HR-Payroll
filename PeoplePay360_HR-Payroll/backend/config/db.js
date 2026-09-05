const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const connString = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peoplepay360').trim();
  try {
    const conn = await mongoose.connect(connString);
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database Warning] MongoDB Connection Error: ${error.message}`);
    console.warn(`[Database Notice] Application running with memory persistence mode enabled.`);
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
