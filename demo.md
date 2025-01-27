## What's New

- Oros queries EVM chain balances & executes erc20 transfers independent of any 3rd party dApp support
- Updated architecture to make extending chain support & functionality more streamlined and automated when possible.

## Architecture

- Tools are grouped into messages and queries
    - Message: "Send 100 USDt to ...."
    - Query: "What is my USDt balance?"

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
