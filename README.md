# Oros AI: Empowering Decentralized Applications with Intelligent Agents

![Oros Logo](https://raw.githubusercontent.com/Kava-Labs/oros/refs/heads/main/src/features/blockchain/assets/orosLogo256.svg)

[![Build Status](https://img.shields.io/github/actions/workflow/status/kava-labs/oros/ci-cd.yml?branch=main&label=CI)](https://github.com/kava-labs/oros/actions)

[![License](https://img.shields.io/github/license/Kava-Labs/oros)](https://github.com/Kava-Labs/oros/blob/main/LICENSE)

[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen)](https://github.com/Kava-Labs/oros/network/dependencies)

Oros brings AI-driven interactions to any dApp. Designed as an intuitive agent layer, Oros transforms how users interact with blockchain ecosystems by bridging advanced AI with on-chain capabilities. Imagine managing your assets, executing complex DeFi strategies, or exploring new dApps—all with a simple conversation. That’s the vision of Oros.

---

## Oros: AI for Everyone, Everywhere

Overcoming technical complexity and fragmented user experiences is a key unlock for web3 adoption. Oros simplifies blockchain interaction, introducing a consistent, approachable AI persona—your trusted guide across dApps.

- **Natural Language → On-Chain Actions**: Oros translates user queries and prompts into blockchain function calls, letting your users “speak” directly to DeFi, NFTs, governance, or any on-chain logic.
- **Smart Context**: Oros provides a unified, intelligent presence that feels personalized and seamless across web3, whether you’re staking tokens or exploring yield strategies.
- **Universal Access**: By integrating with decentralized applications, Oros democratizes access to blockchain intelligence, making Web3 easier for everyone.

### Why It Matters

**For Users**  
Blockchain interactions often feel complex. With Oros, you can simply say:

- _“Stake my KAVA rewards”_
- _“Send 100 USDT to Alice”_  
  Oros understands your intent, navigates the technicalities, and executes securely.

**For Developers**  
Integrating Oros means less time spent building custom AI tools and more time focusing on what your dApp does best. A straightforward SDK enables any dApp to embed the Oros experience effortlessly.

---

## Technical Architecture

```markdown
    +------------------------------+
    |     Oros UI (Front-End)      |
    |     (React/Typescript)       |
    +---------------+--------------+
                    |
                    ▼

+---------------------------------------+
| Oros Agent (Chat + Tools Orchestr.) |
| - Core AI logic (LLM-based) |
| - Tool registry (function specs) |
| - Session & memory layer |
+-------------------+-------------------+
|
▼
+---------------------------------------+
| Tools / Skills |
| - Contract calls, off-chain APIs |
| e.g., stakeTokens(), transferERC20() |
+-------------------+-------------------+
|
▼
+--------------------+
| Blockchain(s) |
| (Kava, EVM, etc.) |
+--------------------+
```

1. **Front-End**: The user-facing interface (React) that embeds an Oros chat widget.
2. **Oros Agent**: Receives user prompts, uses LLM logic & memory, decides which tool(s) to call.
3. **Tool Registry**: A set of typed “function calls.” Each function can be a contract method or off-chain API.
4. **Blockchain**: Actual transaction logic — Kava chain, EVM, or custom protocols.

---

## How It Works

At its core, Oros is a bridge between natural language and blockchain actions, leveraging cutting-edge AI to interpret user requests and perform on-chain operations.

1. **Understanding Intent**  
   Oros processes user input using advanced language models, breaking down requests into actionable components. Whether it’s staking tokens or bridging assets, Oros knows what needs to be done.

2. **Executing Actions**  
   Oros translates user intents into on-chain function calls, working within the frameworks of supported dApps. Every action is verified and secure.

3. **Building Relationships (Next Steps)**  
   Over time, Oros learns user preferences and habits (securely and with consent), providing a richer, more tailored experience.

---

## Key Features

- **Conversational Simplicity**  
   Interact with blockchain assets as if you’re chatting with a knowledgeable friend.
- **Universal Compatibility**  
   Works across multiple dApps and ecosystems, starting with the Kava blockchain.

- **User-Centric Security**  
   Every transaction requires user approval, ensuring complete control over actions.

- **Developer-Friendly Integration**  
   An easy-to-use SDK makes embedding Oros into any dApp a breeze.

---

## Product Roadmap

| Milestone                  | Description                                          | Status         |
| -------------------------- | ---------------------------------------------------- | -------------- |
| **Oros MVP**               | Basic chat + tool bridging, single dApp integration  | ✅ Done        |
| **Multi-dApp Integration** | Expand Oros to multiple Kava dApps                   | 🚧 In progress |
| **Cross-Chain Support**    | EVM bridging (ERC20 transfers, bridging logic)       | 🚧 In progress |
| **Advanced Memory**        | Persistent user context across sessions              | 📅 Planned     |
| **TEE / Security**         | Integrate secure enclaves for private data + signing | 📅 Planned     |
| **deModel Integration**    | Connection to community-trained LLMs                 | 📅 Planned     |

---

## Getting Started

#### 1. **Prerequisites**

Before you begin, ensure you have the following tools installed:

- **Go**: [Install Go](https://go.dev/doc/install) (version 1.19 or higher recommended)
- **Node.js and npm**: [Install Node.js](https://nodejs.org/) (version 18.x or higher recommended)

To verify installations, run:

```bash
go version
node -v
npm -v
```

#### 2. **Clone the Repository**

Clone the Oros project to your local machine:

```bash
git clone https://github.com/Kava-Labs/oros.git
cd oros
```

#### 3. **Set Up the Backend**

Oros requires an OpenAI API key for its backend. Obtain your key from [OpenAI's API portal](https://platform.openai.com/account/api-keys).

Run the following command to start the backend API:

```bash
OPENAI_API_KEY=<your_key> OPENAI_BASE_URL=https://api.openai.com/v1 go run ./api/cmd/api/main.go
```

#### 4. **Set Up the Frontend**

Before starting the frontend, create a `.env` file in the root of the project to configure the necessary environment variable. The file should contain the following:

```bash
VITE_OPENAI_BASE_URL=http://localhost:5555/openai/v1
```

After creating the `.env` file, install the required dependencies by running:

```bash
npm install
npm run dev
```

#### 5. **Access the Application**

The frontend should now be running on `http://localhost:3000`. Open your browser and interact with Oros locally!

#### 6. **Troubleshooting**

If you encounter issues:

- Ensure your OpenAI API key is valid.
- Verify all required tools (Go, Node.js, npm) are installed and up-to-date.
- Check for detailed error logs in the backend or frontend terminal output.
