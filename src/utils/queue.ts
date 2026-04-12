import EventEmitter from "events";
import ContentHistory from "../models/contentHistoryModel";

// This simulates a decoupled Message Queue (like RabbitMQ or BullMQ).
// By handling this asynchronously, we ensure the main Express thread remains unblocked!
class JobQueue extends EventEmitter {}

const backgroundQueue = new JobQueue();

// Worker: Listens for "SAVE_HISTORY" jobs
backgroundQueue.on("SAVE_HISTORY", async (payload: any) => {
  try {
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
    console.log(`[Queue Worker] Successfully processed History Job for Note: ${payload.noteId}`);
  } catch (err) {
    console.error("[Queue Worker] Failed to save history", err);
  }
});

export default backgroundQueue;
