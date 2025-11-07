import mongoose from "mongoose";
const { Schema, models, model, Types } = mongoose;
import { STATUSES } from "@/constants/statuses";

const userGameSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    game: {
      type: Types.ObjectId,
      ref: "Game",
      required: true,
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

const UserGame = models.UserGame || model("UserGame", userGameSchema);

export default UserGame;
