let latestSensorSample = null;

export const setLatestSensorSample = (sample) => {
  latestSensorSample = {
    ...(sample || {}),
    createdAt: new Date().toISOString(),
  };
};

export const getLatestSensorSample = () => latestSensorSample;
