import mongoose from "mongoose";
const { Schema, models, model, Types } = mongoose;

mongoose.set("strictQuery", true);

const reviewSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    game: {
      type: Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: 0,
      max: 10,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reviewBody: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ user: 1, game: 1 }, { unique: true });

const Review = models.Review || model("Review", reviewSchema);

export default Review;
