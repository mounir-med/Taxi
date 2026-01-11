import * as stationService from "../services/station.service.js";

export async function createStation(req, res) {
  try {
    const station = await stationService.createStation(req.body);
    res.status(201).json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStations(req, res) {
  try {
    const stations = await stationService.getStations();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStationById(req, res) {
  try {
    const station = await stationService.getStationById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStation(req, res) {
  try {
    const station = await stationService.updateStation(
      req.params.id,
      req.body
    );
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteStation(req, res) {
  try {
    const success = await stationService.deleteStation(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.json({ message: "Station deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
