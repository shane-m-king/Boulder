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
    IGDBid: {
      type: Number,
      default: null,
    },
    IGDBrating: {
      type: Number,
      default: null,
    },
    IGDBtotalRating: {
      type: Number,
      default: null,
    },
    IGDBratingCount: {
      type: Number,
      default: null,
    },
    IGDBhypes: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gameSchema.index({ title: 1 });
gameSchema.index({ IGDBratingCount: -1, title: 1, _id: 1 });
gameSchema.index({ genres: 1 });
gameSchema.index({ platforms: 1 });
// Unique only for real IGDB ids: the partial filter skips null/missing values,
// so games created without an IGDB id don't collide on the unique index
gameSchema.index(
  { IGDBid: 1 },
  { unique: true, partialFilterExpression: { IGDBid: { $type: "number" } } }
);

const Game = models.Game || model("Game", gameSchema);

export default Game;
