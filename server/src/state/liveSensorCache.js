let latestSensorSample = null;

export const setLatestSensorSample = (sample) => {
  latestSensorSample = {
    ...(sample || {}),
    createdAt: new Date().toISOString(),
  };
};

export const getLatestSensorSample = () => latestSensorSample;

export const getFreshLatestSensorSample = (maxAgeMs = 45_000) => {
  if (!latestSensorSample?.createdAt) {
    return null;
  }

  const ageMs = Date.now() - new Date(latestSensorSample.createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs > maxAgeMs) {
    return null;
  }

  return latestSensorSample;
};
