import { useAppContext } from './contexts/AppContext';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { Chat } from './components/chat';
import { ChatControls } from './components/ChatControls';

export const App = () => {
  const { clearChatMessages } = useAppContext();

  return (
    <>
      <Header />
      <main>
        <DemoBanner />
        <Chat />
        <ChatControls clearMessages={clearChatMessages} />
      </main>
    </>
  );
}