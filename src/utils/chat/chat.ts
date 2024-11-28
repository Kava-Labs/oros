import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool, ChatCompletionChunk } from 'openai/resources/index';

let client: OpenAI | null = null;

/**
 * Configuration object for the chat function.
 */
export interface ChatConfig {
    /** The model to use for the chat completion. */
    model: string;
    /** Array of message parameters for the chat completion. */
    messages: ChatCompletionMessageParam[];
    /** Optional array of tools for the chat completion. */
    tools?: ChatCompletionTool[];

    /** Callback function called with each content chunk received. */
    onData: (chunk: string) => void;
    /** Callback function called when the chat completion is done. */
    onDone: () => void;
    /** Callback function called when tool calls are requested. */
    onToolCallRequest: (toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[]) => void;
    /** Optional callback function called when the chat completion is cancelled. */
    onCancel?: () => void;

    /** Optional custom OpenAI client instance (useful for mocks/testing) */
    openAI?: OpenAI;
};

/**
 * Checks if the given ChatCompletionChunk is a content chunk.
 * @param result - The ChatCompletionChunk to check.
 * @returns True if the chunk contains content, false otherwise.
 */
const isContentChunk = (result: ChatCompletionChunk): boolean => {
    const delta = result.choices[0].delta;
    // Sometimes content is an empty string, so we check if content is a string property.
    if (delta && ("content" in delta) && typeof delta.content === 'string') {
        return true;
    }
    return false;
};

/**
 * Checks if the given ChatCompletionChunk is a tool call chunk.
 * @param result - The ChatCompletionChunk to check.
 * @returns True if the chunk contains tool calls, false otherwise.
 */
const isToolCallChunk = (result: ChatCompletionChunk): boolean => {
    if (result.choices[0]?.delta && result.choices[0].delta.tool_calls) {
        return true;
    }
    return false;
};

/**
 * Assembles tool calls from the streamed ChatCompletionChunk.
 * @param result - The ChatCompletionChunk containing tool call data.
 * @param toolCallsState - The state array to assemble tool calls into.
 */
const assembleToolCallsFromStream = (
    result: ChatCompletionChunk,
    toolCallsState: ChatCompletionChunk.Choice.Delta.ToolCall[]
): void => {
    if (!result.choices[0].delta?.tool_calls) {
        return;
    }

    // Assemble chunks of the tool call.
    // Iterate over all tool calls (more than one may be present).
    for (const tcChunk of result.choices[0].delta.tool_calls) {
        if (toolCallsState.length <= tcChunk.index) {
            // Push a new tool call request.
            toolCallsState.push({
                index: tcChunk.index,
                id: "",
                function: { name: "", arguments: "" },
            });
        }
        // Fill in info as we get it streamed for the corresponding tool call index.
        const partialTC = toolCallsState[tcChunk.index];
        if (tcChunk.id) partialTC.id += tcChunk.id;
        if (tcChunk.function?.name) partialTC.function!.name += tcChunk.function.name;
        if (tcChunk.function?.arguments)
            partialTC.function!.arguments += tcChunk.function.arguments;
    }
};

/**
 * Initiates a chat completion request with streaming responses.
 * @param cfg - The configuration object for the chat completion.
 * @returns A function to cancel the streaming request.
 */
export function chat(cfg: ChatConfig) {
    let cancel = false; // Stream cancellation flag.

    // if no openAI object is given
    // create one 
    // otherwise use the provided one (this is very useful for mocking openAI during testing)
    if (!cfg.openAI && !client) {
        client = new OpenAI({
            apiKey: import.meta.env['VITE_OPENAI_API_KEY'], // once Proxy is up, use getToken() here
            dangerouslyAllowBrowser: true,
        });
    }

    // Launch an async IIFE with closure on the cancel flag.
    // This allows us to return a cancel function to the caller.
    // The function ends when either the stream is finished or the cancel function is called.
    (async (cfg: ChatConfig) => {
        const { model, messages, tools, onData, onDone, onToolCallRequest, onCancel, openAI } = cfg;
        const toolCallsState: ChatCompletionChunk.Choice.Delta.ToolCall[] = [];
        const cl = openAI ? openAI : client!;

        const stream = await cl.chat.completions.create({
            model,
            messages,
            tools,
            stream: true,
        });

        for await (const chunk of stream) {
            if (cancel) {
                stream.controller.abort();
                if (onCancel) onCancel();
                break;
            }

            if (isContentChunk(chunk)) {
                onData(chunk.choices[0].delta.content as string);
            } else if (isToolCallChunk(chunk)) {
                assembleToolCallsFromStream(chunk, toolCallsState);
            } else {
                // console.info(`finish_reason: ${chunk.choices[0].finish_reason}`);
                if (toolCallsState.length) {
                    onToolCallRequest([...toolCallsState]);
                    toolCallsState.length = 0;
                }
                onDone();
            }
        }
    })(cfg);

    return () => { cancel = true; };
};
