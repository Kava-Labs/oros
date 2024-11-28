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
            name: "transferERC20",
            description: "Transfers ERC20 tokens from one address to another address",
            parameters: {
                type: "object",
                properties: {
                    assetName: {
                        type: "string",
                        description: "The name of the ERC20 token to be transferred (i.e. USDt, WHARD, WKAVA, etc.)",
                    },
                    senderAddress: {
                        type: "string",
                        description: "The address sending the ERC20 tokens (the wallet that is connected)",
                    },
                    receiverAddress: {
                        type: "string",
                        description: "The address receiving the ERC20 tokens",
                    },
                    amount: {
                        type: "number",
                        description: "The amount of ERC20 tokens to send",
                    },
                },
                required: ["assetName", "senderAddress", "receiverAddress", "amount"],
            },
        },
    },
]; 
