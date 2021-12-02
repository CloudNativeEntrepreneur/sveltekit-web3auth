// SvelteKit server API calls

export const handleAuthenticate =
  (clientId) =>
  ({ address, signature }: { address: string; signature: string }) =>
    fetch(`/auth/login`, {
      body: JSON.stringify({ clientId, address, signature }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => response.json());

export const handleSignup = (clientId: string) => (address: string) =>
  fetch(`/auth/users/register`, {
    body: JSON.stringify({ address, clientId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).then((response) => response.json());
