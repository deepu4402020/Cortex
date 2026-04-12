import { Schema, model } from "mongoose";

const contentHistorySchema = new Schema(
  {
    noteId: {
      type: Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
    savedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Note",
    },
    content: {
      type: String,
      default: "",
    },
    // The version number corresponds to the master document's __v
    version: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Optimize queries for a specific note's history
contentHistorySchema.index({ noteId: 1, createdAt: -1 });

const ContentHistoryModel = model("ContentHistory", contentHistorySchema);
export default ContentHistoryModel;
