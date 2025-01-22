// import { useEffect, useState } from 'react';
// import { useChainOperations } from '../hooks/useChainOperations';
// import { KAVA_COSMOS_CONFIG } from '../app/config/chains';

// type ChatMessageRoles = 'user' | 'assistant' | 'system';

// interface ChatMessage {
//   role: ChatMessageRoles;
//   content: string;
//   toolCalls?: Array<{
//     id: string;
//     function: {
//       name: string;
//       arguments: string;
//     };
//   }>;
// }

// interface ToolCallResult {
//   toolCallId: string;
//   output: string;
// }

// /**
//  * TODO: Most of this component is just to show example usage. It would be better to plug
//  *       in the configuration items form here into our existing components
//  */
// export const Chat = () => {
//   // Chat message history. This can probably be dropped in favor of the redux store
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   // Current user input
//   const [input, setInput] = useState('');
//   const [isWalletConnected, setIsWalletConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   // Access to chain operations
//   const { getOpenAITools, executeOperation } = useChainOperations();

//   /**
//    * Initialize wallet connection on component mount.
//    * Attempts to connect to MetaMask with the Kava configuration.
//    */
//   useEffect(() => {
//     const initWallet = async () => {
//       const walletManager = WalletManager.getInstance();
//       const address =
//         await walletManager.initializeMetamask(KAVA_COSMOS_CONFIG);
//       setIsWalletConnected(!!address);
//     };

//     initWallet();
//   }, []);

//   /**
//    * Handles the execution of tools suggested by the AI.
//    * Builds, signs, and broadcasts transactions when necessary.
//    * @param toolName - Name of the tool to execute
//    * @param params - Parameters for the tool
//    */
//   const handleToolCall = async (toolName: string, params: unknown) => {
//     try {
//       // TODO: This could be improved
//       const operationType = toolName.replace(/_/g, '/').toUpperCase();
//       const result = await executeOperation(operationType, params);

//       const walletManager = WalletManager.getInstance();
//       const wallet = await walletManager.getCurrentWallet();

//       if (!wallet) {
//         throw new Error('Wallet not connected');
//       }

//       const signedTx = await wallet.signTransaction(result);

//       /**
//        * TODO: We need to do the broadcast loop here, maybe postTxAsync in some form
//        *       but we need a version of that which is not unique to KAVA
//        *
//        * TODO: So far the transaction building does not take into account fees or gas
//        */
//       const response = await fetch(
//         'https://api.kava.io/cosmos/tx/v1beta1/txs',
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             tx_bytes: signedTx,
//             mode: 'BROADCAST_MODE_SYNC',
//           }),
//         },
//       );

//       const broadcastResult = await response.json();

//       if (broadcastResult.tx_response?.code !== 0) {
//         throw new Error(
//           broadcastResult.tx_response?.raw_log || 'Transaction failed',
//         );
//       }

//       return {
//         success: true,
//         hash: broadcastResult.tx_response.txhash,
//       };
//     } catch (error: unknown) {
//       console.error('Error executing tool:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : error,
//       };
//     }
//   };

//   // TODO: This should be replaced with our streaming and tooling setup
//   const processToolCalls = async (toolCalls: ChatMessage['toolCalls']) => {
//     if (!toolCalls) return [];

//     const results: ToolCallResult[] = [];

//     for (const toolCall of toolCalls) {
//       const args = JSON.parse(toolCall.function.arguments);
//       const result = await handleToolCall(toolCall.function.name, args);

//       results.push({
//         toolCallId: toolCall.id,
//         output: JSON.stringify(result),
//       });
//     }

//     return results;
//   };

//   // TODO: This should be replaced with our streaming and tooling setup
//   const callOpenAI = async (messages: ChatMessage[]) => {
//     const response = await fetch('YOUR_OPENAI_ENDPOINT', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: 'gpt-4-turbo-preview',
//         messages,
//         tools: getOpenAITools(),
//         tool_choice: 'auto',
//       }),
//     });

//     return response.json();
//   };

//   /**
//    * TODO: This is also just part of the user sending a chat to openai. It
//    *       should be replaced with our actual "send the chat to the backend" logic
//    */
//   const handleSend = async () => {
//     if (!input.trim() || isLoading) return;

//     setIsLoading(true);
//     const newMessages = [
//       ...messages,
//       { role: 'user' as ChatMessageRoles, content: input },
//     ];
//     setMessages(newMessages);
//     setInput('');

//     try {
//       let currentMessages = newMessages;

//       while (true) {
//         const aiResponse = await callOpenAI(currentMessages);
//         const assistantMessage = aiResponse.choices[0].message;

//         if (!assistantMessage.tool_calls) {
//           // No tool calls, just add the message and break
//           setMessages([...currentMessages, assistantMessage]);
//           break;
//         }

//         // Process tool calls
//         const toolResults = await processToolCalls(assistantMessage.tool_calls);

//         // Add assistant message and tool results to the conversation
//         currentMessages = [
//           ...currentMessages,
//           assistantMessage,
//           ...toolResults.map((result) => ({
//             role: 'tool',
//             content: result.output,
//             tool_call_id: result.toolCallId,
//           })),
//         ];

//         setMessages(currentMessages);

//         // If we received a final response, break
//         if (!assistantMessage.tool_calls) break;
//       }
//     } catch (error) {
//       console.error('Error processing message:', error);
//       setMessages([
//         ...newMessages,
//         {
//           role: 'assistant',
//           content: 'Sorry, I encountered an error processing your request.',
//         },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   /**
//    * TODO: This is just a junk component to show example usage. It should be tossed
//    *       and we should use our actual components
//    */
//   return (
//     <div className="flex flex-col h-screen">
//       <div className="flex-1 overflow-auto p-4">
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={`mb-4 ${
//               message.role === 'user' ? 'text-right' : 'text-left'
//             }`}
//           >
//             <div
//               className={`inline-block p-2 rounded ${
//                 message.role === 'user'
//                   ? 'bg-blue-500 text-white'
//                   : 'bg-gray-200'
//               }`}
//             >
//               {message.content}
//             </div>
//           </div>
//         ))}
//         {isLoading && (
//           <div className="flex justify-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
//           </div>
//         )}
//       </div>
//       <div className="p-4 border-t">
//         <div className="flex gap-2">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             className="flex-1 p-2 border rounded"
//             placeholder="Type your message..."
//             disabled={!isWalletConnected || isLoading}
//           />
//           <button
//             onClick={handleSend}
//             className={`px-4 py-2 rounded ${
//               isWalletConnected
//                 ? 'bg-blue-500 text-white hover:bg-blue-600'
//                 : 'bg-gray-300 cursor-not-allowed'
//             }`}
//             disabled={!isWalletConnected || isLoading}
//           >
//             Send
//           </button>
//         </div>
//         {!isWalletConnected && (
//           <p className="text-red-500 mt-2">
//             Please connect your wallet to continue
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };
