import { useAppContext } from './contexts/useAppContext';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { ChatContainer } from './components/Chat';
import { ChatControls } from './components/ChatControls';

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
