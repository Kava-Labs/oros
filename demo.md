## What's New

- Oros queries EVM chain balances & executes erc20 transfers independent of any 3rd party dApp support
- Updated architecture to make extending chain support & functionality more streamlined and automated when possible.

## Architecture

- We register the tools necessary to turn natural language into specific actions
- Tools are grouped into messages and queries
    - Messages execute transactions: "Send 100 USDt to ...."
    - Queries return on-chain information: "What is my USDt balance on Kava EVM?"
- When a user prompt corresponds to a tool call definition: , receive a response (list of token balances, transaction
  hash, etc.)
    - Execute that tool call's function
    - Receive a response
        - Transaction status (in progress, completed)
        - List of account balances
        - Transaction hash
        - Error code (if user cancels in wallet for instance)
    - Display this information to the user with nice UX

## Currently Supported Workflows

- A user asks for their balances
    - if they don't specify which chain, we default to Kava EVM
    - if they specify the chain, fetch balances for that chain (currently a small, hardcoded list)
- A user asks to transfer funds
    - Again, if no chain specified, assume Kava EVM
    - First, validate the transaction parameters
        - Is the user connected with a supported wallet?
        - Is the user asking to transfer a supported denom?
        - Is the user asking to use a supported chain?
    - If valid, take these parameters and build the transaction data to send to metamask
        - This step includes the "unmasking" of the user's
          address `address_1 => 0xc07918e451ab77023a16fa7515dd60433a3c771d` 
