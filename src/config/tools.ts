import type { ChatCompletionTool } from 'openai/resources/index';

export const tools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "getAccountBalances",
            description: "Gets The Account Balances for a Kava Chain User",
            parameters: {
                type: "object",
                properties: {
                    address: {
                        type: "string",
                        description: "The account address to fetch the balances for",
                    },
                },
                required: ["address"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "sendKava",
            description: "Transfers KAVA tokens from one address to another",
            parameters: {
                type: "object",
                properties: {
                    senderAddress: {
                        type: "string",
                        description: "The address sending the KAVA tokens",
                    },
                    receiverAddress: {
                        type: "string",
                        description: "The address receiving the KAVA tokens",
                    },
                    amount: {
                        type: "number",
                        description: "The amount of KAVA tokens to send",
                    },
                },
                required: ["senderAddress", "receiverAddress", "amount"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "sendUsdt",
            description: "Transfers USDt tokens to another address",
            parameters: {
                type: "object",
                properties: {
                    senderAddress: {
                        type: "string",
                        description: "The address sending the USDt token (the connected wallet)",
                    },
                    receiverAddress: {
                        type: "string",
                        description: "The address receiving the USDt tokens",
                    },
                    amount: {
                        type: "number",
                        description: "The amount of USDt tokens to send",
                    },
                },
                required: ["senderAddress", "receiverAddress", "amount"],
            },
        },
    },
];
