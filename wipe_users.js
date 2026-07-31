require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Refusing to run: MONGODB_URI is not set.");
  process.exit(1);
}

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.collection("users");
  const result = await db.deleteMany({});
  console.log(`Deleted ${result.deletedCount} users.`);
  
  // Verify count
  const count = await db.countDocuments();
  console.log(`Verified count: ${count} users remaining.`);
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
