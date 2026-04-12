// this has Database scehma

import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  user_name: {
    type: String,
    required: true,
    maxLength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserModel = model("User", UserSchema);
export default UserModel;
