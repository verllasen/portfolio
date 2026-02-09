import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { MainMenu } from './pages/MainMenu';
import { Onboarding } from './pages/Onboarding';
import { Lobby } from './pages/Lobby';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { Leaderboard } from './pages/Leaderboard';
import { Settings } from './pages/Settings';
import { ProfileSetup } from './pages/ProfileSetup';
import { MissionReport } from './pages/MissionReport';
import { BackgroundMusic } from './components/BackgroundMusic';
import { useGameStore } from './store/useGameStore';

function App() {
  const { view, currentUser, setView, initSocket } = useGameStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // Redirect to menu if user exists but view is profile-setup (persistence fix)
  if (currentUser && view === 'profile-setup') {
    setView('menu');
  }

  if (!currentUser && view !== 'profile-setup') {
     setView('profile-setup');
  }

  if (view === 'profile-setup') {
    return (
      <>
        <BackgroundMusic />
        <ProfileSetup />
      </>
    );
  }
  
  // Mission Report is a standalone fullscreen view (optional, but looks better)
  if (view === 'report') {
    return <MissionReport />;
  }

  return (
    <Layout>
      <BackgroundMusic />
      {view === 'menu' && <MainMenu />}
      {view === 'create-studio' && <Onboarding />}
      {view === 'lobby' && <Lobby />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'workspace' && <Workspace />}
      {view === 'leaderboard' && <Leaderboard />}
      {view === 'settings' && <Settings />}
    </Layout>
  );
}

export default App;
