import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

mongoose.set("strictQuery", true);

const gameSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    genres: {
      type: [String],
      required: [true, "Please provide a set of genres"],
    },
    platforms: {
      type: [String],
      required: [true, "Please provide a set of platforms"],
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: [true, "Please provide release date"],
    },
  },
  {
    timestamps: true,
  }
);

const Game = models.Game || model("Game", gameSchema);

export default Game;
