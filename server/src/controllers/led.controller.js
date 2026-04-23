const ALLOWED_COLORS = ["red", "green", "blue", "off"];

let latestCommand = {
  id: 0,
  color: "off",
  updatedAt: new Date().toISOString(),
};

export const getLatestLedCommandSnapshot = () => latestCommand;

export const setLedCommand = (req, res) => {
  const color = String(req.body?.color || "").toLowerCase().trim();

  if (!ALLOWED_COLORS.includes(color)) {
    return res.status(400).json({
      message: "Invalid color. Use one of: red, green, blue, off",
    });
  }

  latestCommand = {
    id: latestCommand.id + 1,
    color,
    updatedAt: new Date().toISOString(),
  };

  const wsClients = req.app.get("wsClients");
  if (wsClients && typeof wsClients.forEach === "function") {
    const payload = JSON.stringify({
      type: "ledCommand",
      ...latestCommand,
    });
    wsClients.forEach((client) => {
      if (client && client.readyState === 1) {
        client.send(payload);
      }
    });
  }

  return res.status(200).json(latestCommand);
};

export const getLatestLedCommand = (_req, res) => {
  return res.status(200).json(latestCommand);
};
