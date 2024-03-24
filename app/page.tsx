import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";

import { ChainEnum } from "@dynamic-labs/sdk-api";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import Link from "next/link";
import OpenAI from "openai";
import {createEmbeddedWallet} from "../lib/dynamic";
import {createOrFindEmbeddedWalletForFid} from "../lib/embedded-wallet";
import { openAsBlob } from "fs";
import { randomInt } from "crypto";

type State = {
  page: number;
};

// const systemPrompt: ChatCompletionMessageParam = {"role": "system", "content": "Assume the role of the BitLife game, guiding me through various life stages with decisions to make at each point. Present me with choices for my character's actions, from birth through adulthood, including education, career, relationships, and other life events. Reflect on the consequences of my decisions, affecting my character's happiness, health, smarts, and looks. Provide options for activities like jobs, hobbies, and interactions with other characters, each with potential outcomes. Let's start my digital life journey, detailing my character's initial stats and the first major decision I need to make. What's my first life event, and what choices do I have? Keep responses below 60 words. In the first line of every response, outline the player's age, health %, happiness %, and assets ($). For example, Age: x, Health: x%, Happiness: x%, Assets: $x.xx"};
// const systemPrompt: ChatCompletionMessageParam = {
//   "role": "system",
//   "content": "Assume the role of a Cryptic Master in a blockchain-themed Dungeons & Dragons game. I am a pioneer in this digital frontier, navigating through the Decentralized Forest, known for its cryptographic puzzles and ledger ruins. Craft a vivid and interactive world of smart contracts and token treasures. Present challenges and encounters with NPCs guarding ancient algorithms. Manage mechanics like code battles and transaction verifications, asking for my decisions. Describe outcomes based on my actions, using creativity and crypto concepts as your guide. Our quest begins as I step into the Byte Woods, a place buzzing with digital energy and hidden Non-Fungible Tokens. Set the scene, and what's my first encounter? 🌲💻🔍 Keep responses succinct, use emojis for flair, and capitalize KEY terms."
// }
const systemPrompt: ChatCompletionMessageParam = {"role": "system", "content": "Assume the role of a Dungeon Master in a Dungeons & Dragons game. I am a player in this adventure. Guide me through a detailed and immersive fantasy world, presenting scenarios, challenges, and encounters. Describe the settings vividly, and create interactive dialogue with NPCs. Manage gameplay mechanics like combat and skill checks when necessary, asking me for my actions and decisions. Provide outcomes based on my choices, using your imagination and D&D rules as a guide. How do you set the scene, and what happens next? Keep responses below 50 words without newlines and use emojis and capitalizations for dramatic effect."};
  
const startString = "Welcome to FrameQuest! \n\n What adventure would you like to go on today? \n (Genres: Space, Fantasy, Mystery, Survival ...) \n (Universes: Harry Potter, Pokemon, Marvel, LOTR ...) \n\n Or do you have a specific scenario in mind!"
const result: string[] = [startString];

let conversationLog: ChatCompletionMessageParam[] = [
  {"role": "assistant", "content": startString}
];
const initialState = { page: 1 };


const reducer: FrameReducer<State> = (state, action) => {
  const buttonIndex = action.postBody?.untrustedData.buttonIndex;
  return {
    page:
      state.page === 1 && buttonIndex === 1
        ? 2
        : buttonIndex === 1
        ? state.page - 1
        : buttonIndex === 2
        ? state.page + 1
        : 1,
  };
};

const lastPage = 6;

let status = "initial"
let IpfsHash = ["hash"];
let newWallets: string[] = [];
let notFirst = false;
let mintUrl = "";
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
});

// This is a react server component only
export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const previousFrame = getPreviousFrame<State>(searchParams);
  const lastInput = previousFrame.postBody?.untrustedData.inputText;
  const lastButtonIndex = previousFrame.postBody?.untrustedData.buttonIndex;
  const fid = previousFrame.postBody?.untrustedData.fid || 1;

  console.log(previousFrame);
  console.log(previousFrame.postBody?.untrustedData.inputText);
  let openaiResult = "";

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  if (lastButtonIndex == 1 && lastInput && status == "initial") {
    conversationLog.push({"role": "user", "content": lastInput});

    const completion = await openai.chat.completions.create({
      messages: [systemPrompt, ...conversationLog],
      model: "gpt-3.5-turbo-0125",
    });

    openaiResult = completion?.choices?.[0]?.message?.content ?? "";
  
    console.log(completion.choices[0]);
    console.log(completion.choices[0]?.message.content);
    console.log(openaiResult);

    conversationLog.push({"role": "assistant", "content": openaiResult});
    result.push(openaiResult);

    notFirst = true;
  }
  else if (lastButtonIndex == 2 && status != "initial") {
    // reset game
    status = "initial";
    state.page = 1;
    conversationLog = [
      {"role": "assistant", "content": startString}
    ];
    openaiResult = "";
    notFirst = false;
  }
  else if (lastButtonIndex == 2 && status != "end") {
    status = "end";
    const outputJSON = JSON.stringify(conversationLog)
    console.log("save as JSON: ", outputJSON);

    const options = {
      method: 'POST',
      headers: {Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`, 'Content-Type': 'application/json'},
      body: outputJSON
    };
    
    await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', options)
      .then(response => response.json())
      .then(response => {
        console.log(response);
        IpfsHash.push(response.IpfsHash);
      })
      .catch(err => console.error(err));
  }

  else if (
    status !== "initial" &&
    lastButtonIndex === 1
  ) {
    // mint nft
    try {
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          Authorization: 'e16c450b-8cf4-4609-bb13-3be526d5fa98'
        },
        body: JSON.stringify({
          chain: 'polygon',
          name: 'FrameQuest NFT',
          description: `Your FrameQuest NFT with your amazing adventure log! Link: https://ipfs.io/ipfs/${IpfsHash}`,
          file_url: 'https://media.discordapp.net/attachments/1161450447807193091/1221137466673860761/DALLE_2024-03-22_23.31.01_-_Design_a_digital_drawing_for_a_die-cut_sticker_of_a_cute_pixelated_adventurer._The_character_should_be_in_a_classic_8-bit_style_reminiscent_of_early_.webp?ex=66117be3&is=65ff06e3&hm=c23c32c7b2a540f6b905c84d16d98ad9a873588b6be3b011af67e9745f7c54b4&=&format=webp&width=1038&height=1038',
          mint_to_address: newWallets[0] || '0x0E5d299236647563649526cfa25c39d6848101f5'
        })
      };
      
      await fetch('https://api.nftport.xyz/v0/mints/easy/urls', options)
        .then(response => response.json())
        .then(response => {
          console.log(response);
          mintUrl = response.transaction_external_url;
        })
        .catch(err => console.error(err));
      status = "nft";
    } catch (e) {
      console.log(e)    
    }
  }

  else if (
    status !== "initial" &&
    lastButtonIndex === 3
  ) {
    try {
      newWallets = await createEmbeddedWallet(lastInput || "", fid, [
        ChainEnum.Evm,
      ]);
      console.log(newWallets);
      status = "dynamic";
    } catch (e) {
      console.log(e)    
    }
  }

  else if (
    status !== "initial" &&
    lastButtonIndex === 4
  ) {
    // privy wallet
    const ownerAddress = "0x0E5d299236647563649526cfa25c39d6848101f5";

    // Generate an embedded wallet associated with the fid
    const embeddedWalletAddress = await createOrFindEmbeddedWalletForFid(fid, ownerAddress);

    console.log(embeddedWalletAddress);
    newWallets = [embeddedWalletAddress];
    status = "privy"
  }





  // const validMessage = await validateActionSignature(previousFrame.postBody);

  // console.log(validMessage);







  // then, when done, return next frame

  // TODO: Mint NFT when adventure is done
  // TODO: Upload json of adventure to pinata
  // privy embedded wallet, dynamic embedded wallet
  return (
    <div>
      <a href="https://framesjs.org">frames.js</a> homeframe{" "}
      {process.env.NODE_ENV === "development" ? (
        <Link href="/debug">Debug</Link>
      ) : null}
      <FrameContainer
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage aspectRatio="1.91:1">
        {status == "initial" && <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center">
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ margin: '50px', whiteSpace: "pre-wrap", textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            {result[result.length - 1]}
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ margin: '20px', textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Last Input: {lastInput}
          </div>
        </div>} 
        {status == "end" && <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center" style={{marginLeft: "50px", marginRight: "50px", fontFamily: "Impact, Charcoal, sans-serif"}}>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Thank you for playing FrameQuest! Your adventure can be saved as an NFT below! 🎉
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
          https://brown-real-puma-604.mypinata.cloud/ipfs/{IpfsHash[IpfsHash.length - 1]}
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
          Please create an embedded wallet to receive your NFT!
          </div>
        </div>}
        {status == "dynamic" && <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center" style={{marginLeft: "50px", marginRight: "50px", fontFamily: "Impact, Charcoal, sans-serif"}}>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Thank you for playing FrameQuest! Your adventure can be saved as an NFT below! 🎉
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Dynamic Wallet Address: {newWallets[newWallets.length - 1]}
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Click "Mint NFT" to receive your NFT!
          </div>
        </div>}
        {status == "privy" && <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center" style={{marginLeft: "50px", marginRight: "50px", fontFamily: "Impact, Charcoal, sans-serif"}}>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Thank you for playing FrameQuest! Your adventure can be saved as an NFT below! 🎉
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Privy Wallet Address: {newWallets[0]}
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Click "Mint NFT" to receive your NFT!
          </div>
        </div>}
        {status == "nft" && <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center" style={{marginLeft: "50px", marginRight: "50px", fontFamily: "Impact, Charcoal, sans-serif"}}>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            FrameQuest NFT is minted! 🎉
          </div>
          <div tw="flex flex-row border border-white rounded-lg p-2" style={{ textAlign: "center", padding: "30px", fontFamily: "Impact, Charcoal, sans-serif" }}>
            Wallet Address: {newWallets[0]}
          </div>
        </div>}

        </FrameImage>
        <FrameInput text={status != "end" ? "Type your response here!" : "Type your email here."}></FrameInput>
        
        {/* {lastInput?.toLowerCase()?.includes("end") && <FrameButton>End</FrameButton>} */}
        {(status == "initial" ? <FrameButton>Next 🎮</FrameButton> :  (newWallets.length >= 1 ? <FrameButton>Mint NFT! 💿</FrameButton> : <FrameButton action="link" target={`https://brown-real-puma-604.mypinata.cloud/ipfs/${IpfsHash[IpfsHash.length - 1]}`}>View your story on Pinata! 💾</FrameButton>))}
        {status != "initial" ? <FrameButton>Reset Game. ↪️</FrameButton>
        :  <FrameButton>End Game. 🎬</FrameButton>}
        {status != "initial" ? <FrameButton>Get Dynamic Wallet! 🪪</FrameButton>
        :  null}
        {status != "initial" ? <FrameButton>Get Privy Wallet! 💳</FrameButton>
        :  null}
      </FrameContainer>
    </div>
  );
}
