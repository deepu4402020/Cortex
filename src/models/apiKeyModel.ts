import { Schema, model } from "mongoose";

const apiKeySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: "Integration Key",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const APIKeyModel = model("APIKey", apiKeySchema);
export default APIKeyModel;
