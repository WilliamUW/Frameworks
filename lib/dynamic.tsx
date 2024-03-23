import { Button, Frog, TextInput } from "frog";

import { ChainEnum } from "@dynamic-labs/sdk-api/models/ChainEnum";
import { UserResponse } from "@dynamic-labs/sdk-api/models/UserResponse";
import { configDotenv } from "dotenv";
import { handle } from "frog/vercel";

configDotenv();

const key = process.env.KEY;
const environmentId = process.env.ENVIRONMENT_ID;
let newWallets: string[];

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
});

const createEmbeddedWallet = async (
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

app.frame("/", async (c) => {
  const { frameData, inputText, status, buttonValue } = c;
  const isValidEmail = inputText
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputText)
    : false;

  const fid = frameData?.fid;
  let error = status != "initial" && (!isValidEmail || !fid);

  if (
    !error &&
    status != "initial" &&
    isValidEmail &&
    inputText &&
    fid &&
    buttonValue === "submit"
  ) {
    try {
      newWallets = await createEmbeddedWallet(inputText, fid, [
        ChainEnum.Sol,
        ChainEnum.Evm,
      ]);
    } catch (e) {
      error = true;
    }
  }

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background:
            "url('https://utfs.io/f/56f3dcce-8eee-4cc4-8ece-240a03298b6b-r0q65m.jpeg')",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background:
              "url('https://utfs.io/f/56f3dcce-8eee-4cc4-8ece-240a03298b6b-r0q65m.jpeg')",
            backgroundSize: "100% 100%",
            display: "flex",
            flexDirection: "column",
            flexWrap: "nowrap",
            height: "100%",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            fontSize: 30,
            fontStyle: "normal",
          }}
        >
          {status === "initial" && !error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                margin: "auto",
              }}
            >
              <div
                style={{
                  color: "black",
                  fontWeight: "bold",
                  fontSize: "2rem",
                  textAlign: "center",
                }}
              >
                Create a Dynamic EVM+Solana embedded wallet
              </div>
              <div
                style={{
                  color: "black",
                  textAlign: "center",
                  marginTop: "2rem",
                  maxWidth: "75%",
                }}
              >
                Enter your email to generate a wallet. The wallet will also be
                associated with your Farcaster ID.
              </div>
            </div>
          ) : newWallets && newWallets.length > 0 ? (
            newWallets.map((wallet, index) => (
              <div key={index} style={{ color: "black" }}>
                {index == 0 ? `EVM: ${wallet}` : `SOL: ${wallet}`}
              </div>
            ))
          ) : (
            <div style={{ color: "black" }}>
              No wallets created yet or an error occurred.
            </div>
          )}
        </div>
      </div>
    ),
    intents:
      status === "initial"
        ? [
            <TextInput placeholder="Enter a valid email" />,
            <Button value="submit">Create SOL + EVM Embedded Wallets</Button>,
          ]
        : [
            <Button.Link href="https://demo.dynamic.xyz/?use-environment=Farcaster">
              Log in to access your wallets
            </Button.Link>,
          ],
  });
});

export const GET = handle(app);
export const POST = handle(app);