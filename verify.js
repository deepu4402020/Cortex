"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobModel_1 = __importDefault(require("./src/models/jobModel"));
const queue_1 = require("./src/utils/queue");
function verify() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect("mongodb://localhost:27017/secondbrain");
        console.log("Connected to MongoDB.");
        // 1. Verify TTL index
        const indexes = yield jobModel_1.default.collection.indexes();
        console.log("Indexes on jobs collection:", indexes);
        const ttlIndex = indexes.find(i => { var _a; return (_a = i.name) === null || _a === void 0 ? void 0 : _a.includes("expiresAt"); });
        if (ttlIndex && ttlIndex.expireAfterSeconds === 0) {
            console.log("✅ TTL index verified.");
        }
        else {
            console.error("❌ TTL index missing or incorrect.");
        }
        // 2. Race test (2 workers)
        yield jobModel_1.default.deleteMany({});
        // Seed 20 jobs
        for (let i = 0; i < 20; i++) {
            yield jobModel_1.default.create({ type: "TEST_JOB", payload: { i } });
        }
        console.log("Seeded 20 jobs.");
        let processedCount = 0;
        // Temporary override processJob for test
        const originalStartWorker = queue_1.startWorker;
        // We can't easily override the private processJob in queue.ts without modifying it.
        // Actually, queue.ts' processJob will throw "Unknown job type: TEST_JOB", which is fine!
        // It will fail and retry 3 times, then go to failed.
        // This tests both race conditions and the retry logic.
        (0, queue_1.startWorker)();
        (0, queue_1.startWorker)(); // Start two workers
        // Wait 10 seconds for jobs to process
        yield new Promise(resolve => setTimeout(resolve, 10000));
        const failedJobs = yield jobModel_1.default.countDocuments({ status: "failed" });
        console.log(`Failed jobs (expected 20): ${failedJobs}`);
        // Check if any job has retries > 3
        const badJobs = yield jobModel_1.default.countDocuments({ retries: { $gt: 3 } });
        console.log(`Jobs with > 3 retries (expected 0): ${badJobs}`);
        // 3. Stuck job recovery test
        const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 mins ago
        yield jobModel_1.default.create({ type: "TEST_JOB", payload: { stuck: true }, status: "processing", processingStartedAt: oldDate });
        console.log("Created stuck job.");
        // Wait 3 seconds for worker to recover it
        yield new Promise(resolve => setTimeout(resolve, 3000));
        const recoveredJob = yield jobModel_1.default.findOne({ "payload.stuck": true });
        if (recoveredJob && recoveredJob.status === "pending") {
            console.log("✅ Stuck job recovered.");
        }
        else if (recoveredJob && recoveredJob.status === "failed") {
            console.log("✅ Stuck job recovered and then failed.");
        }
        else {
            console.log("❌ Stuck job not recovered.", recoveredJob === null || recoveredJob === void 0 ? void 0 : recoveredJob.status);
        }
        process.exit(0);
    });
}
verify().catch(console.error);
