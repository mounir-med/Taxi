import * as passagerService from "../services/passager.service.js";

export async function createPassager(req, res) {
  try {
    const passager = await passagerService.createPassager(req.body);
    res.status(201).json(passager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPassagers(req, res) {
  try {
    const passagers = await passagerService.getPassagers();
    res.json(passagers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPassagerById(req, res) {
  try {
    const passager = await passagerService.getPassagerById(req.params.id);
    if (!passager) return res.status(404).json({ error: "Passager not found" });
    res.json(passager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePassager(req, res) {
  try {
    const passager = await passagerService.updatePassager(req.params.id, req.body);
    if (!passager) return res.status(404).json({ error: "Passager not found" });
    res.json(passager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deletePassager(req, res) {
  try {
    const success = await passagerService.deletePassager(req.params.id);
    if (!success) return res.status(404).json({ error: "Passager not found" });
    res.json({ message: "Passager deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addVoyageController(req, res) {
  try {
    const { passagerId, stationId } = req.body;
    const passager = await passagerService.addVoyage(passagerId, stationId);
    res.json(passager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export async function removeVoyageController(req, res) {
  try {
    const { passagerId, stationId } = req.body;
    const passager = await passagerService.removeVoyage(passagerId, stationId);
    res.json(passager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
