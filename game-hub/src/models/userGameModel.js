import mongoose from "mongoose";
const { Schema, models, model, Types } = mongoose;
import { STATUSES } from "@/constants/statuses";
import "./userModel";
import "./gameModel";

mongoose.set("strictQuery", true);

const userGameSchema = new Schema(
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
    status: {
      type: String,
      enum: STATUSES,
      required: true,
      default: "Not Owned",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

userGameSchema.index({ user: 1, game: 1 }, { unique: true });

const UserGame = models.UserGame || model("UserGame", userGameSchema);

export default UserGame;
