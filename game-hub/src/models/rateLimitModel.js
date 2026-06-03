import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

mongoose.set("strictQuery", true);

// Tracks request counts per key (e.g. "<ip>:login") within a time window.
// Records self-delete once the window passes via the TTL index below.
const rateLimitSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    required: true,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index: MongoDB removes the document once expiresAt has passed
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = models.RateLimit || model("RateLimit", rateLimitSchema);

export default RateLimit;
