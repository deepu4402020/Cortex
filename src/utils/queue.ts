import Job from "../models/jobModel";
import ContentHistory from "../models/contentHistoryModel";

const POLL_INTERVAL = 2000;
const STUCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const addJob = async (type: string, payload: any) => {
  try {
    const job = new Job({ type, payload });
    await job.save();
    console.log(`[Queue] Added job ${job._id} of type ${type}`);
  } catch (err) {
    console.error("[Queue] Failed to add job:", err);
  }
};

const processJob = async (job: any) => {
  if (job.type === "SAVE_HISTORY") {
    const payload = job.payload;
    const history = new ContentHistory({
      noteId: payload.noteId,
      savedBy: payload.userId,
      title: payload.title,
      content: payload.content,
      version: payload.version
    });
    
    // Simulate complex background processing time
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    await history.save();
  } else {
    throw new Error(`Unknown job type: ${job.type}`);
  }
};

export const startWorker = () => {
  console.log("[Worker] Starting background worker...");
  
  setInterval(async () => {
    try {
      // 1. Log queue depth to monitor if polling interval < arrival rate
      const pendingCount = await Job.countDocuments({ status: "pending" });
      if (pendingCount > 0) {
        console.log(`[Worker] Queue depth (pending): ${pendingCount}`);
      }

      // 2. Recover stuck jobs (Processing but older than timeout)
      // This handles the failure mode where a worker crashes mid-job and prevents silent job loss.
      const stuckCutoff = new Date(Date.now() - STUCK_TIMEOUT_MS);
      const stuckJobs = await Job.updateMany(
        { status: "processing", processingStartedAt: { $lt: stuckCutoff } },
        { $set: { status: "pending", processingStartedAt: null } }
      );
      if (stuckJobs.modifiedCount > 0) {
        console.log(`[Worker] Recovered ${stuckJobs.modifiedCount} stuck jobs`);
      }

      // 3. Atomic claim of next pending job
      // Prevents double-processing if multiple workers scale up
      const job = await Job.findOneAndUpdate(
        { status: "pending" },
        { $set: { status: "processing", processingStartedAt: new Date() } },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!job) return; // No jobs to process

      console.log(`[Worker] Picked up job ${job._id} of type ${job.type}`);

      try {
        await processJob(job);
        
        // 4. Mark completed and set TTL expiration (7 days)
        job.status = "completed";
        job.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await job.save();
        console.log(`[Worker] Successfully processed job ${job._id}`);
      } catch (err: any) {
        console.error(`[Worker] Job ${job._id} failed:`, err);
        if (job.retries < 3) {
           job.status = "pending";
           job.retries += 1;
           job.processingStartedAt = undefined;
        } else {
           job.status = "failed";
           job.error = err.message;
           job.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        await job.save();
      }

    } catch (err) {
      console.error("[Worker] Polling error:", err);
    }
  }, POLL_INTERVAL);
};
