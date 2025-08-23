import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function generate(message) {
  const messages = [
    {
      role: "system",
      content: `You are a smart personal assistant who answers the asked questions.
           You have access to following tools:
           1. webSearch({ query } : { query: string }) 
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