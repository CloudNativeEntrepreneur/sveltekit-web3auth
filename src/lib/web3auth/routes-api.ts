// SvelteKit server API calls

export const handleAuthenticate =
  (clientId) =>
  ({
    publicAddress,
    signature,
  }: {
    publicAddress: string;
    signature: string;
  }) =>
    fetch(`/auth/login`, {
      body: JSON.stringify({ clientId, publicAddress, signature }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => response.json());

export const handleSignup = (clientId: string) => (publicAddress: string) =>
  fetch(`/auth/users/register`, {
    body: JSON.stringify({ publicAddress, clientId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).then((response) => response.json());
