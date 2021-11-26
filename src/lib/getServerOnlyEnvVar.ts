export const getServerOnlyEnvVar = (config: any, key) => {
  const { env } = config;
  return env[key];
};
