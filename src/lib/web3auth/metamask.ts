export const handleSignMessage =
  (web3) =>
  async ({ address, nonce }: { address: string; nonce: string }) => {
    try {
      const signature = await web3!.eth.personal.sign(
        `I am signing my one-time nonce: ${nonce}`,
        address,
        "" // MetaMask will ignore the password argument here
      );

      return { address, signature };
    } catch (err) {
      throw new Error("You need to sign the message to be able to log in.");
    }
  };
