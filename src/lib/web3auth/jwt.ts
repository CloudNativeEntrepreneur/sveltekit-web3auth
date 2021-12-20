export const getTokenData = (jwt: string): any => {
  let data;
  try {
    data = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
  } catch (e) {
    try {
      data = JSON.parse(atob(jwt.split(".")[1]).toString());
    } catch (err) {
      return {};
    }
  }

  return data;
};

export function isTokenExpired(jwt: string): boolean {
  if (!jwt || jwt.length < 10) {
    return true;
  }
  const tokenTimeSkew = 10; // 10 seconds before actual token exp

  const data = getTokenData(jwt);
  const now = new Date().getTime() / 1000;
  const expirationTime = data?.exp || 0 - tokenTimeSkew;
  const isExpired = now > expirationTime;
  return isExpired;
}
