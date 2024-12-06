import { useAppContext } from "./contexts/AppContext";
import { DemoBanner } from "./components/DemoBanner";
import { ChatControls } from "./components/ChatControls";
import { ChatContainer } from "./components/ChatWindow";
import { Header } from "./components/Header";

export const App = () => {
  const { clearChatMessages } = useAppContext();

  return (
    <>
      <Header />
      <main>
        <DemoBanner />
        <ChatContainer />
        <ChatControls clearMessages={clearChatMessages} />
      </main>
    </>
  );
};
