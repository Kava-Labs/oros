# Oros AI: Empowering Decentralized Applications with Intelligent Agents

![Oros Logo](https://raw.githubusercontent.com/Kava-Labs/oros/refs/heads/main/src/assets/orosLogo.svg?token=GHSAT0AAAAAAC2PI2UV4YLEUHJB63XNY6J4Z4IEMUA)

Oros is the future of AI in decentralized applications (dApps). Designed as an intuitive agent layer, Oros transforms how users interact with blockchain ecosystems by bridging advanced AI with on-chain capabilities. Imagine managing your assets, executing complex DeFi strategies, or exploring new dApps—all with a simple conversation. That’s the vision of Oros.

---

## Oros: AI for Everyone, Everywhere

In a world dominated by technical jargon and fragmented user experiences, Oros simplifies blockchain interaction. It introduces a consistent, approachable AI persona—your trusted guide across dApps.

- **One Agent, One Brand**: Oros isn’t just another chatbot. It’s a unified, intelligent presence that feels personal and seamless, whether you’re staking tokens or exploring yield strategies.
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

## Getting Started

### For Developers

Ready to dive in and set up Oros locally? Follow these steps to get started:

---

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
git clone https://github.com/<your-repo-path>/oros.git
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
