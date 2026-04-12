import { Schema, model, Document, Types } from "mongoose";

const contentSchema = new Schema(
  {
    userId: {
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
    tags: [{
      type: String,
    }],
    isPublic: {
      type: Boolean,
      default: false,
    },
    sharedWith: [{
      email: String,
      role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
    }]
  },
  {
    timestamps: true,
  }
);

// Indexes are a great talking point for interviews (performance & text search functionality)
contentSchema.index({ title: "text", content: "text" });

const ContentModel = model("Content", contentSchema, "Contents");

export default ContentModel;
