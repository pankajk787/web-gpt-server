import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function generate(message) {
  const messages = [
    {
      role: "system",
      content: `You are a smart personal assistant, WebGPT.
          If you know the answer to a question answer it directly in plain English.
          If the answer requires real-time, local, or up-to-date information or if you don't know the answer use the available tools to find it. 
           You have access to following tool:
           1. webSearch({ query } : { query: string }) : Use this to search the internet for current or unknown information.

           Decide when to use a your own knowledge and when to use the tool.
           Also, if something can't be done by youself or with tool calling then directly answer that you will not be able to generate response for the asked question

           Examples:
           Q: What is the Capital of France?
           A: The capital of France is Paris.

           Q. What is the wether in Kolkata right now?
           A. <use the webSearch tool to find the latest weather>

           Q. 2 + 3 = ?
           A. 2 + 3 = 5

           Q. Tell me the latest IT news?
           A. <use webSearch tool to find the latest IT news>

           Q. Generate a video of tow kids playing in the garden.
           A. Sorry. I am a model that does not support video generation.

           current date and time is ${new Date().toUTCString()} // Search the latest information and realtime data on the internet
          `,
    },
  ];

    messages.push({
      role: "user",
      content: message,
    });
    while (true) {
      const completions = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Search the latest information and realtime data on the internet",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to perform search on",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });
      const toolCalls = completions.choices[0].message.tool_calls;
      if (!toolCalls) {
        return completions.choices[0].message.content;
      }
      messages.push(completions.choices[0].message);

      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArgs = tool.function.arguments;

        if (functionName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(functionArgs));
          // push the tool call result to message history
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
        }
      }
    }

}

async function webSearch({ query }) {
  console.log("Searching web...");
  const response = await tvly.search(query);
  const finalResult = response.results.map((x) => x.content).join("\n\n");
  return finalResult;
}

// test
// async function gen() {
//     console.log("Response::", await generate("What is the weather in Kolkata Today?"));
// }
// gen();