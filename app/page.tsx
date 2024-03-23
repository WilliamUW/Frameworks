import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";

import Link from "next/link";
import OpenAI from "openai";
import { openAsBlob } from "fs";

type State = {
  page: number;
  conversationLog: string[];
};

const initialState = { page: 1, conversationLog: [] };

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
    conversationLog: state.conversationLog,
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
    state.conversationLog.push(lastInput);

    const completion = await openai.chat.completions.create({
      messages: [{"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": lastInput}],
      model: "gpt-3.5-turbo",
    });

    openaiResult = completion?.choices?.[0]?.message?.content ?? "";
  
    console.log(completion.choices[0]);
    console.log(completion.choices[0]?.message.content);
    console.log(openaiResult);

    state.conversationLog.push(openaiResult);


  }

  // then, when done, return next frame
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
          <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex flex-col">
          {state.conversationLog.map((log) =>  <div tw="flex flex-row">{log}</div>)}
          </div>
        </FrameImage>
        <FrameInput text={"Type here"}></FrameInput>
        {state.page !== 1 ? (
          <FrameButton>←</FrameButton>
        ) : (
          <FrameButton action="link" target="https://framesjs.org/">
            Open docs
          </FrameButton>
        )}
        {state.page < 6 ? (
          <FrameButton>→</FrameButton>
        ) : (
          <FrameButton action="link" target="https://framesjs.org">
            Open frames.js
          </FrameButton>
        )}
      </FrameContainer>
    </div>
  );
}
