import express from "express";
import {
  createPassager,
  getPassagers,
  getPassagerById,
  updatePassager,
  deletePassager
} from "../controllers/passager.controller.js";
import { addVoyageController } from "../controllers/passager.controller.js";
import { removeVoyageController } from "../controllers/passager.controller.js";

const router = express.Router();

router.post("/", createPassager);
router.get("/", getPassagers);
router.get("/:id", getPassagerById);
router.put("/:id", updatePassager);
router.delete("/:id", deletePassager);
router.post("/voyage/add", addVoyageController);
router.post("/voyage/remove", removeVoyageController);

export default router;
