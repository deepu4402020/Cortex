import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  type: string;
  payload: any;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  processingStartedAt?: Date;
  retries: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const JobSchema = new Schema<IJob>(
  {
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true
    },
    error: { type: String },
    processingStartedAt: { type: Date },
    retries: { type: Number, default: 0 },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

// TTL index to automatically delete completed/failed jobs after they expire
JobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IJob>("Job", JobSchema);
