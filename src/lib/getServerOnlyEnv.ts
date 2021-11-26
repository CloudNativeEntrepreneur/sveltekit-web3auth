export const getServerOnlyEnv = (config: any, key) => {
  const { env } = config;
  return env[key];
};
