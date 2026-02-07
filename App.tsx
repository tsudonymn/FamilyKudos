import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, FamilyMember, User } from './types';
import { DEFAULT_FAMILY_MEMBERS, DEFAULT_QUICK_TASKS } from './constants';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { getEncouragement } from './services/geminiService';
import { createFamilyGroup, getFamilyGroup, updateFamilyGroup, subscribeToFamilyGroup } from './services/storageService';
import { sendTaskNotification } from './services/chatService';
import { logTaskToExternalWebhook, logThankToExternalWebhook } from './services/webhookService';
import GeminiMessage from './components/GeminiMessage';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import { config } from './config';

declare const google: any;

const GOOGLE_CLIENT_ID = config.googleClientId;
const SHARED_STORAGE_KEY_TASKS = 'familyKudos_shared_tasks';
const SHARED_STORAGE_KEY_MEMBERS = 'familyKudos_shared_members';
const STORAGE_KEY_QUICK_SEEDS = 'familyKudos_quick_seeds';
const STORAGE_KEY_FAMILY_GROUP_ID = 'familyKudos_familyGroupId';
const STORAGE_KEY_LAST_MEMBER = 'familyKudos_lastSelectedMemberId';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
        const stored = localStorage.getItem('familyKudosUser');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
  });

  // CRITICAL FIX: Ensure familyMembers and seeds use defaults if storage is missing or empty
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => {
    try {
      const saved = localStorage.getItem(SHARED_STORAGE_KEY_MEMBERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_FAMILY_MEMBERS;
  });

  const [quickTaskSeeds, setQuickTaskSeeds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUICK_SEEDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_QUICK_TASKS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(SHARED_STORAGE_KEY_TASKS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [activeMemberId, setActiveMemberId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_LAST_MEMBER);
    return stored ? Number(stored) : null;
  });

  const [familyGroupId, setFamilyGroupId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_FAMILY_GROUP_ID);
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiMessage, setGeminiMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const isGoogleAuthConfigured = !GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID");

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
    if (script) script.addEventListener('load', initializeGSI);
    if (window.google) initializeGSI();
    return () => { if (script) script.removeEventListener('load', initializeGSI); };
  }, [isGoogleAuthConfigured, user]);
  
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

  useEffect(() => {
    if (user && !isDataLoaded) {
      const loadData = async () => {
        try {
            if (familyGroupId) {
                const cloudData = await getFamilyGroup(familyGroupId);
                setTasks(cloudData.tasks || []);
                if (cloudData.members) setFamilyMembers(cloudData.members);
                if (cloudData.quickTaskSeeds) setQuickTaskSeeds(cloudData.quickTaskSeeds);
            }
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Cloud load failed, using local/defaults:", error);
            setIsDataLoaded(true);
        }
      };
      loadData();
    }
  }, [user, isDataLoaded, familyGroupId]);

  useEffect(() => {
    if (familyGroupId && isDataLoaded) {
        const unsubscribe = subscribeToFamilyGroup(
            familyGroupId, 
            (data) => {
                if (data.tasks) setTasks(prev => JSON.stringify(prev) !== JSON.stringify(data.tasks) ? data.tasks : prev);
                if (data.members) setFamilyMembers(prev => JSON.stringify(prev) !== JSON.stringify(data.members) ? data.members : prev);
                if (data.quickTaskSeeds) setQuickTaskSeeds(prev => JSON.stringify(prev) !== JSON.stringify(data.quickTaskSeeds) ? data.quickTaskSeeds : prev);
            },
            (error) => console.error("Subscription error:", error)
        );
        return () => unsubscribe();
    }
  }, [familyGroupId, isDataLoaded]);

  useEffect(() => {
    if (user && (isDataLoaded || !familyGroupId)) {
      try {
        localStorage.setItem(SHARED_STORAGE_KEY_TASKS, JSON.stringify(tasks));
        localStorage.setItem(SHARED_STORAGE_KEY_MEMBERS, JSON.stringify(familyMembers));
        localStorage.setItem(STORAGE_KEY_QUICK_SEEDS, JSON.stringify(quickTaskSeeds));
        if (familyGroupId) syncToCloud(tasks, familyMembers, quickTaskSeeds);
      } catch (error) {
        console.error("Could not save data", error);
      }
    }
  }, [tasks, familyMembers, quickTaskSeeds, user, isDataLoaded, familyGroupId, syncToCloud]);
  
  const handleLogout = () => {
    if (isGoogleAuthConfigured && window.google) google.accounts.id.disableAutoSelect();
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
    const taskId = Date.now();
    const taskTimestamp = new Date().toISOString();
    const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `task-${taskId}-${Math.random().toString(36).substr(2, 9)}`;

    const newTask: Task = {
      id: taskId,
      uuid,
      description,
      memberId,
      appreciatorIds: [],
      timestamp: taskTimestamp,
    };
    
    setTasks(prev => [newTask, ...prev]);
    const memberName = familyMembers.find(m => m.id === memberId)?.name || 'Someone';
    
    try {
        logTaskToExternalWebhook({ uuid, who: memberName, task: description, timestamp: taskTimestamp });
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
    if (!activeMemberId) {
        alert("Please select who you are first!");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const activeMember = familyMembers.find(m => m.id === activeMemberId);
    if (!activeMember) {
        console.error("Could not find family member with ID:", activeMemberId);
        return;
    }

    const taskToThank = tasks.find(t => t.id === taskId);
    if (!taskToThank) return;

    const isAlreadyAppreciated = taskToThank.appreciatorIds?.includes(activeMemberId);

    if (!isAlreadyAppreciated) {
        const thankUuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `thank-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const payload = {
            timestamp: new Date().toISOString(),
            uuid: thankUuid,
            taskId: taskToThank.uuid || String(taskToThank.id),
            memberName: activeMember.name, // THIS IS THE NAME WE WANT LOGGED
            type: "thanks"
        };

        // CRITICAL DEBUG LOG FOR WEBHOOK
        console.log('%c DEBUG: Sending thank-you to webhook ', 'background: #ec4899; color: white; font-weight: bold; padding: 4px; border-radius: 4px;');
        console.log('Payload Details:', payload);
        
        logThankToExternalWebhook(payload);
    }

    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id !== taskId) return task;
        const newAppreciatorIds = isAlreadyAppreciated
          ? task.appreciatorIds.filter(id => id !== activeMemberId)
          : [...(task.appreciatorIds || []), activeMemberId];
        return { ...task, appreciatorIds: newAppreciatorIds };
      })
    );
  };

  const handleDeleteTask = (taskId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };

  const handleActiveMemberChange = (id: number | null) => {
      setActiveMemberId(id);
      if (id) localStorage.setItem(STORAGE_KEY_LAST_MEMBER, String(id));
      else localStorage.removeItem(STORAGE_KEY_LAST_MEMBER);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm("Restore family members and task suggestions to defaults? This will overwrite your local changes.")) {
      setFamilyMembers(DEFAULT_FAMILY_MEMBERS);
      setQuickTaskSeeds(DEFAULT_QUICK_TASKS);
      setActiveMemberId(null);
      localStorage.removeItem(STORAGE_KEY_LAST_MEMBER);
      localStorage.removeItem(SHARED_STORAGE_KEY_MEMBERS);
      localStorage.removeItem(STORAGE_KEY_QUICK_SEEDS);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
           <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 mb-2">Family Kudos</h1>
           <p className="text-slate-600 mb-8 text-lg">Sign in to share and celebrate your family's contributions.</p>
           {isGoogleAuthConfigured && (
               <>
                 <div id="signInDiv" className="flex justify-center mb-4"></div>
                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Or continue as guest</span></div>
                </div>
               </>
           )}
            <button onClick={handleGuestLogin} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group border border-slate-200">
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
          onUpdateMembers={setFamilyMembers}
          onUpdateSeeds={setQuickTaskSeeds}
          onRestoreDefaults={handleRestoreDefaults}
          onClose={() => setIsSettingsOpen(false)}
          familyGroupId={familyGroupId}
          onCreateGroup={async () => {
             setIsSyncing(true);
             const id = await createFamilyGroup({ tasks, members: familyMembers, quickTaskSeeds });
             setFamilyGroupId(id);
             localStorage.setItem(STORAGE_KEY_FAMILY_GROUP_ID, id);
             setIsSyncing(false);
          }}
          onJoinGroup={async (id) => {
             setIsSyncing(true);
             const data = await getFamilyGroup(id);
             setTasks(data.tasks || []);
             setFamilyMembers(data.members || DEFAULT_FAMILY_MEMBERS);
             setQuickTaskSeeds(data.quickTaskSeeds || DEFAULT_QUICK_TASKS);
             setFamilyGroupId(id);
             localStorage.setItem(STORAGE_KEY_FAMILY_GROUP_ID, id);
             setIsSettingsOpen(false);
             setIsSyncing(false);
          }}
          onLeaveGroup={() => {
              if (window.confirm("Disconnect from group?")) {
                  setFamilyGroupId(null);
                  localStorage.removeItem(STORAGE_KEY_FAMILY_GROUP_ID);
              }
          }}
          isSyncing={isSyncing}
        />
      )}
      
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="w-12"></div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 text-center">Family Kudos</h1>
            <UserProfile user={user} onLogout={handleLogout} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <TaskForm
          familyMembers={familyMembers}
          quickTaskSeeds={quickTaskSeeds}
          onAddTask={handleAddTask}
          isLoading={isGeminiLoading}
          user={user}
          activeMemberId={activeMemberId}
          onActiveMemberChange={handleActiveMemberChange}
        />
        <h2 className="text-2xl font-bold text-slate-800 mb-6 mt-12 flex items-center gap-2">
            Our Awesome Contributions
            {familyGroupId && <span className="bg-sky-100 text-sky-600 text-xs px-2 py-1 rounded-full font-medium">Cloud Synced</span>}
        </h2>
        <TaskList
          tasks={sortedTasks}
          familyMembers={familyMembers}
          activeMemberId={activeMemberId}
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