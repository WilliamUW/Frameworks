import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";

import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import Link from "next/link";
import OpenAI from "openai";
import { openAsBlob } from "fs";

type State = {
  page: number;
};

// const systemPrompt: ChatCompletionMessageParam = {"role": "system", "content": "Assume the role of the BitLife game, guiding me through various life stages with decisions to make at each point. Present me with choices for my character's actions, from birth through adulthood, including education, career, relationships, and other life events. Reflect on the consequences of my decisions, affecting my character's happiness, health, smarts, and looks. Provide options for activities like jobs, hobbies, and interactions with other characters, each with potential outcomes. Let's start my digital life journey, detailing my character's initial stats and the first major decision I need to make. What's my first life event, and what choices do I have? Keep responses below 60 words. In the first line of every response, outline the player's age, health %, happiness %, and assets ($). For example, Age: x, Health: x%, Happiness: x%, Assets: $x.xx"};
// const systemPrompt: ChatCompletionMessageParam = {
//   "role": "system",
//   "content": "Assume the role of a Cryptic Master in a blockchain-themed Dungeons & Dragons game. I am a pioneer in this digital frontier, navigating through the Decentralized Forest, known for its cryptographic puzzles and ledger ruins. Craft a vivid and interactive world of smart contracts and token treasures. Present challenges and encounters with NPCs guarding ancient algorithms. Manage mechanics like code battles and transaction verifications, asking for my decisions. Describe outcomes based on my actions, using creativity and crypto concepts as your guide. Our quest begins as I step into the Byte Woods, a place buzzing with digital energy and hidden Non-Fungible Tokens. Set the scene, and what's my first encounter? 🌲💻🔍 Keep responses succinct, use emojis for flair, and capitalize KEY terms."
// }
const systemPrompt: ChatCompletionMessageParam = {"role": "system", "content": "Assume the role of a Dungeon Master in a Dungeons & Dragons game. I am a player in this adventure. Guide me through a detailed and immersive fantasy world, presenting scenarios, challenges, and encounters. Describe the settings vividly, and create interactive dialogue with NPCs. Manage gameplay mechanics like combat and skill checks when necessary, asking me for my actions and decisions. Provide outcomes based on my choices, using your imagination and D&D rules as a guide. How do you set the scene, and what happens next? Keep responses below 60 words and use emojis and capitalization."};
  
const startString = "Welcome to FrameQuest! What adventure would you like to go on today? (E.g. Space, Fantasy, Mystery) Or do you have a specific scenario in mind!"
const result: string[] = [startString];

const conversationLog: ChatCompletionMessageParam[] = [
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
  console.log(previousFrame);
  console.log(previousFrame.postBody?.untrustedData.inputText);





  // const validMessage = await validateActionSignature(previousFrame.postBody);

  // console.log(validMessage);

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  let openaiResult = "";

  if (lastInput) {
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

  }


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
          <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex flex-col" style={{marginLeft: "50px", marginRight: "50px"}}>
            <div tw="flex flex-row" style={{ whiteSpace: "pre-wrap", textAlign: "center", marginLeft: "50px", marginRight: "50px" }}>{result[result.length - 1]}</div>
            <div tw="flex flex-row" style={{ marginTop: '50px', textAlign: "center", marginLeft: "50px", marginRight: "50px" }}>Last Input: {lastInput}</div>
          </div>
        </FrameImage>
        <FrameInput text={"Type here"}></FrameInput>
        
        {/* {lastInput?.toLowerCase()?.includes("end") && <FrameButton>End</FrameButton>} */}
        <FrameButton>Proceed</FrameButton>
      </FrameContainer>
    </div>
  );
}
