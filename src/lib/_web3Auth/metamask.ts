export const handleSignMessage =
  (web3) =>
  async ({
    publicAddress,
    nonce,
  }: {
    publicAddress: string;
    nonce: string;
  }) => {
    try {
      const signature = await web3!.eth.personal.sign(
        `I am signing my one-time nonce: ${nonce}`,
        publicAddress,
        "" // MetaMask will ignore the password argument here
      );

      return { publicAddress, signature };
    } catch (err) {
      throw new Error("You need to sign the message to be able to log in.");
    }
  };
