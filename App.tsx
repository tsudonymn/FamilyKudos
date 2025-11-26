import React, { useState, useEffect, useCallback } from 'react';
import { Task, FamilyMember, User } from './types';
import { DEFAULT_FAMILY_MEMBERS } from './constants';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { getEncouragement } from './services/geminiService';
import GeminiMessage from './components/GeminiMessage';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';

// This is necessary to access the Google Identity Services library
declare const google: any;

// TODO: Replace with your actual Google Client ID from the Google Cloud Console.
// If you don't have one, the app will automatically offer a Guest Mode.
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiMessage, setGeminiMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Detect if the developer has replaced the placeholder client ID
  const isGoogleAuthConfigured = !GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID");

  // Effect for handling Google Sign-In
  useEffect(() => {
    // Skip GSI initialization if not configured to prevent 401 Invalid Client errors
    if (!isGoogleAuthConfigured) return;

    const handleCredentialResponse = (response: any) => {
      try {
        const idToken = response.credential;
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);

        const loggedInUser: User = {
          name: decodedToken.name,
          email: decodedToken.email,
          picture: decodedToken.picture,
        };
        
        localStorage.setItem('familyKudosUser', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
      } catch (error) {
        console.error("Error decoding Google token:", error);
      }
    };

    const initializeGSI = () => {
      if (window.google) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });
          
          if (!localStorage.getItem('familyKudosUser')) {
              // Only render button if the element exists
              const signInContainer = document.getElementById('signInDiv');
              if (signInContainer) {
                google.accounts.id.renderButton(
                  signInContainer,
                  { theme: 'outline', size: 'large', text: 'signin_with', width: '280' }
                );
              }
          }
        } catch (e) {
          console.error("GSI Initialization failed", e);
        }
      }
    };
    
    // Check for user on initial load
    const storedUser = localStorage.getItem('familyKudosUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // GSI script might load after component mounts
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
        script.addEventListener('load', initializeGSI);
    }
    if (window.google) {
        initializeGSI();
    }
  }, [isGoogleAuthConfigured]);
  
  // Effect for loading data from localStorage after login
  useEffect(() => {
    if (user && !isDataLoaded) {
      const dataKeySuffix = user.email;
      try {
        const savedTasks = localStorage.getItem(`familyKudosTasks_${dataKeySuffix}`);
        setTasks(savedTasks ? JSON.parse(savedTasks) : []);

        const savedMembers = localStorage.getItem(`familyKudosMembers_${dataKeySuffix}`);
        setFamilyMembers(savedMembers ? JSON.parse(savedMembers) : DEFAULT_FAMILY_MEMBERS);

        setIsDataLoaded(true);
      } catch (error) {
        console.error("Could not parse data from localStorage", error);
        setFamilyMembers(DEFAULT_FAMILY_MEMBERS); // Reset to default on error
        setTasks([]);
      }
    }
  }, [user, isDataLoaded]);

  // Effect for saving data to localStorage
  useEffect(() => {
    if (user) {
      const dataKeySuffix = user.email;
      try {
        localStorage.setItem(`familyKudosTasks_${dataKeySuffix}`, JSON.stringify(tasks));
        localStorage.setItem(`familyKudosMembers_${dataKeySuffix}`, JSON.stringify(familyMembers));
      } catch (error) {
        console.error("Could not save data to localStorage", error);
      }
    }
  }, [tasks, familyMembers, user]);
  
  const handleLogout = () => {
    if (isGoogleAuthConfigured && window.google) {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (e) {
        // Ignore errors if GSI isn't fully loaded
      }
    }
    localStorage.removeItem('familyKudosUser');
    setUser(null);
    setIsDataLoaded(false);
    setTasks([]);
    setFamilyMembers([]);
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      name: "Guest Family",
      email: "guest@familykudos.app",
      picture: "https://ui-avatars.com/api/?name=Guest+Family&background=0ea5e9&color=fff&rounded=true&bold=true"
    };
    localStorage.setItem('familyKudosUser', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const handleAddTask = useCallback(async (memberId: number, description: string) => {
    setIsGeminiLoading(true);

    const newTask: Task = {
      id: Date.now(),
      description,
      memberId,
      appreciationCount: 0,
      timestamp: new Date().toISOString(),
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
    
    const memberName = familyMembers.find(m => m.id === memberId)?.name || 'Someone';
    const encouragement = await getEncouragement(memberName, description);
    
    setGeminiMessage(encouragement);
    setIsGeminiLoading(false);
  }, [familyMembers]);
  
  const handleAppreciateTask = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, appreciationCount: task.appreciationCount + 1 }
          : task
      )
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
           <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 mb-2">
            Family Kudos
           </h1>
           <p className="text-slate-600 mb-8 text-lg">
             Sign in to share and celebrate your family's contributions.
           </p>

           {isGoogleAuthConfigured ? (
               <>
                 <div id="signInDiv" className="flex justify-center mb-4"></div>
                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Or continue as guest</span>
                    </div>
                </div>
               </>
           ) : null}

            <button 
                onClick={handleGuestLogin}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group border border-slate-200"
            >
                <span>Continue as Guest</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>
            
            {!isGoogleAuthConfigured && (
                 <p className="mt-6 text-xs text-slate-400">
                    To enable Google Sign-In, update <code>GOOGLE_CLIENT_ID</code> in <code>App.tsx</code>.
                 </p>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <GeminiMessage message={geminiMessage} onClose={() => setGeminiMessage(null)} />
      {isSettingsOpen && (
        <Settings 
          familyMembers={familyMembers}
          onUpdateMembers={setFamilyMembers}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="w-12"></div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 text-center">
            Family Kudos
            </h1>
            <UserProfile 
              user={user}
              onLogout={handleLogout}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <TaskForm
          familyMembers={familyMembers}
          onAddTask={handleAddTask}
          isLoading={isGeminiLoading}
        />
        <h2 className="text-2xl font-bold text-slate-800 mb-6 mt-12">Our Awesome Contributions</h2>
        <TaskList
          tasks={sortedTasks}
          familyMembers={familyMembers}
          onAppreciate={handleAppreciateTask}
        />
      </main>
      
      <footer className="text-center p-6 mt-12 text-slate-500 text-sm">
        <p>Made with ❤️ to celebrate our family.</p>
      </footer>
    </div>
  );
};

export default App;