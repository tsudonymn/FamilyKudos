import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, FamilyMember, User } from './types';
import { DEFAULT_FAMILY_MEMBERS, DEFAULT_QUICK_TASKS } from './constants';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { getEncouragement } from './services/geminiService';
import { createFamilyGroup, getFamilyGroup, updateFamilyGroup, subscribeToFamilyGroup } from './services/storageService';
import { sendTaskNotification } from './services/chatService';
import GeminiMessage from './components/GeminiMessage';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import { config } from './config';

// This is necessary to access the Google Identity Services library
declare const google: any;

const GOOGLE_CLIENT_ID = config.googleClientId;

const SHARED_STORAGE_KEY_TASKS = 'familyKudos_shared_tasks';
const SHARED_STORAGE_KEY_MEMBERS = 'familyKudos_shared_members';
const STORAGE_KEY_QUICK_SEEDS = 'familyKudos_quick_seeds';
const STORAGE_KEY_FAMILY_GROUP_ID = 'familyKudos_familyGroupId';

const App: React.FC = () => {
  // Lazy initialize user from localStorage to avoid effect race conditions
  const [user, setUser] = useState<User | null>(() => {
    try {
        const stored = localStorage.getItem('familyKudosUser');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [quickTaskSeeds, setQuickTaskSeeds] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Cloud Sync State
  const [familyGroupId, setFamilyGroupId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_FAMILY_GROUP_ID);
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiMessage, setGeminiMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Detect if the developer has replaced the placeholder client ID
  const isGoogleAuthConfigured = !GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID");

  // Effect for handling Google Sign-In
  useEffect(() => {
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
          
          const signInContainer = document.getElementById('signInDiv');
          if (signInContainer) {
            google.accounts.id.renderButton(
              signInContainer,
              { theme: 'outline', size: 'large', text: 'signin_with', width: '280' }
            );
          }
        } catch (e) {
          console.error("GSI Initialization failed", e);
        }
      }
    };
    
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
        script.addEventListener('load', initializeGSI);
    }
    
    if (window.google) {
        initializeGSI();
    }
    
    return () => {
        if (script) script.removeEventListener('load', initializeGSI);
    };
  }, [isGoogleAuthConfigured, user]);
  
  // Function to sync data to cloud
  const syncToCloud = useCallback(async (currentTasks: Task[], currentMembers: FamilyMember[], currentSeeds: string[]) => {
      if (!familyGroupId) return;
      
      try {
          setIsSyncing(true);
          await updateFamilyGroup(familyGroupId, {
              tasks: currentTasks,
              members: currentMembers,
              quickTaskSeeds: currentSeeds
          });
      } catch (error) {
          console.error("Error syncing to cloud:", error);
      } finally {
          setIsSyncing(false);
      }
  }, [familyGroupId]);

  // Effect for initial data load (Local or Cloud)
  useEffect(() => {
    if (user && !isDataLoaded) {
      const loadData = async () => {
        try {
            if (familyGroupId) {
                try {
                    const cloudData = await getFamilyGroup(familyGroupId);
                    setTasks(cloudData.tasks || []);
                    setFamilyMembers(cloudData.members || []);
                    setQuickTaskSeeds(cloudData.quickTaskSeeds || DEFAULT_QUICK_TASKS);
                } catch (e) {
                    console.error("Failed to load from cloud, falling back to local", e);
                    const savedTasks = localStorage.getItem(SHARED_STORAGE_KEY_TASKS);
                    setTasks(savedTasks ? JSON.parse(savedTasks) : []);
                    const savedMembers = localStorage.getItem(SHARED_STORAGE_KEY_MEMBERS);
                    setFamilyMembers(savedMembers ? JSON.parse(savedMembers) : DEFAULT_FAMILY_MEMBERS);
                    const savedSeeds = localStorage.getItem(STORAGE_KEY_QUICK_SEEDS);
                    setQuickTaskSeeds(savedSeeds ? JSON.parse(savedSeeds) : DEFAULT_QUICK_TASKS);
                }
            } else {
                const savedTasks = localStorage.getItem(SHARED_STORAGE_KEY_TASKS);
                setTasks(savedTasks ? JSON.parse(savedTasks) : []);

                const savedMembers = localStorage.getItem(SHARED_STORAGE_KEY_MEMBERS);
                setFamilyMembers(savedMembers ? JSON.parse(savedMembers) : DEFAULT_FAMILY_MEMBERS);

                const savedSeeds = localStorage.getItem(STORAGE_KEY_QUICK_SEEDS);
                setQuickTaskSeeds(savedSeeds ? JSON.parse(savedSeeds) : DEFAULT_QUICK_TASKS);
            }
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Could not parse data", error);
            setFamilyMembers(DEFAULT_FAMILY_MEMBERS);
            setQuickTaskSeeds(DEFAULT_QUICK_TASKS);
            setTasks([]);
            setIsDataLoaded(true);
        }
      };
      loadData();
    }
  }, [user, isDataLoaded, familyGroupId]);

  // Real-time Cloud Subscription
  useEffect(() => {
    if (familyGroupId && isDataLoaded) {
        const unsubscribe = subscribeToFamilyGroup(
            familyGroupId, 
            (data) => {
                setTasks(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(data.tasks)) {
                        return data.tasks || [];
                    }
                    return prev;
                });
                setFamilyMembers(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(data.members)) {
                        return data.members || [];
                    }
                    return prev;
                });
                setQuickTaskSeeds(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(data.quickTaskSeeds)) {
                        return data.quickTaskSeeds || DEFAULT_QUICK_TASKS;
                    }
                    return prev;
                });
            },
            (error) => {
                console.error("Subscription error:", error);
            }
        );

        return () => unsubscribe();
    }
  }, [familyGroupId, isDataLoaded]);

  // Sync state to local storage and trigger cloud sync
  useEffect(() => {
    if (user && isDataLoaded) {
      try {
        localStorage.setItem(SHARED_STORAGE_KEY_TASKS, JSON.stringify(tasks));
        localStorage.setItem(SHARED_STORAGE_KEY_MEMBERS, JSON.stringify(familyMembers));
        localStorage.setItem(STORAGE_KEY_QUICK_SEEDS, JSON.stringify(quickTaskSeeds));
        
        if (familyGroupId) {
            syncToCloud(tasks, familyMembers, quickTaskSeeds);
        }
      } catch (error) {
        console.error("Could not save data", error);
      }
    }
  }, [tasks, familyMembers, quickTaskSeeds, user, isDataLoaded, familyGroupId, syncToCloud]);
  
  const handleLogout = () => {
    if (isGoogleAuthConfigured && window.google) {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
    localStorage.removeItem('familyKudosUser');
    setUser(null);
    setIsDataLoaded(false);
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
    
    setTasks(prev => [newTask, ...prev]);
    
    const memberName = familyMembers.find(m => m.id === memberId)?.name || 'Someone';
    
    try {
        const encouragement = await getEncouragement(memberName, description);
        setGeminiMessage(encouragement);
        sendTaskNotification(memberName, description, encouragement);
    } catch (e) {
        console.error("Error in background tasks:", e);
    } finally {
        setIsGeminiLoading(false);
    }
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

  const handleDeleteTask = (taskId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };

  const handleCreateGroup = async () => {
      try {
          setIsSyncing(true);
          const id = await createFamilyGroup({ tasks, members: familyMembers, quickTaskSeeds });
          setFamilyGroupId(id);
          localStorage.setItem(STORAGE_KEY_FAMILY_GROUP_ID, id);
      } catch (e: any) {
          alert(`Failed to create cloud group: ${e.message}`);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleJoinGroup = async (id: string) => {
      try {
          setIsSyncing(true);
          const data = await getFamilyGroup(id);
          setTasks(data.tasks || []);
          setFamilyMembers(data.members || []);
          setQuickTaskSeeds(data.quickTaskSeeds || DEFAULT_QUICK_TASKS);
          setFamilyGroupId(id);
          localStorage.setItem(STORAGE_KEY_FAMILY_GROUP_ID, id);
          setIsSettingsOpen(false);
      } catch (e) {
          alert("Could not join group. Please check the code and try again.");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleLeaveGroup = () => {
      if (window.confirm("Are you sure? You will stop syncing with the family group.")) {
          setFamilyGroupId(null);
          localStorage.removeItem(STORAGE_KEY_FAMILY_GROUP_ID);
      }
  };
  
  const handleUpdateMembers = (newMembers: FamilyMember[]) => setFamilyMembers(newMembers);
  const handleUpdateSeeds = (newSeeds: string[]) => setQuickTaskSeeds(newSeeds);

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
          quickTaskSeeds={quickTaskSeeds}
          onUpdateMembers={handleUpdateMembers}
          onUpdateSeeds={handleUpdateSeeds}
          onClose={() => setIsSettingsOpen(false)}
          familyGroupId={familyGroupId}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onLeaveGroup={handleLeaveGroup}
          isSyncing={isSyncing}
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
          quickTaskSeeds={quickTaskSeeds}
          onAddTask={handleAddTask}
          isLoading={isGeminiLoading}
          user={user}
        />
        <h2 className="text-2xl font-bold text-slate-800 mb-6 mt-12 flex items-center gap-2">
            Our Awesome Contributions
            {familyGroupId && (
                 <span className="bg-sky-100 text-sky-600 text-xs px-2 py-1 rounded-full font-medium" title="Synced with Cloud">Cloud Synced</span>
            )}
        </h2>
        <TaskList
          tasks={sortedTasks}
          familyMembers={familyMembers}
          onAppreciate={handleAppreciateTask}
          onDelete={handleDeleteTask}
        />
      </main>
      
      <footer className="text-center p-6 mt-12 text-slate-500 text-sm">
        <p>Made with ❤️ to celebrate our family.</p>
      </footer>
    </div>
  );
};

export default App;