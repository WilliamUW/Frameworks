import { ChainEnum } from "@dynamic-labs/sdk-api/models/ChainEnum";
import { UserResponse } from "@dynamic-labs/sdk-api/models/UserResponse";

const key = process.env.NEXT_PUBLIC_DYNAMIC_KEY;
const environmentId = process.env.NEXT_PUBLIC_ENVIRONMENT_ID;
let newWallets: string[];

export const createEmbeddedWallet = async (
  email: string,
  fid: number,
  chains: ChainEnum[]
) => {
  console.log("Creating embedded wallets for", email, fid, chains);
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_DYNAMIC_API_KEY}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      fid,
      chains,
    }),
  };

const response = await fetch(
    `https://app.dynamic.xyz/api/v0/environments/${environmentId}/embeddedWallets/farcaster`,
    options
).then((r) => r.json());

console.debug(response, response?.user?.wallets);
newWallets = (response as UserResponse)?.user?.wallets?.map(
    (wallet: any) => wallet.publicKey
) ?? [];

  return newWallets;
};

