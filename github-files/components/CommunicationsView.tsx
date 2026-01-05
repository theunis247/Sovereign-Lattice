
import React, { useState, useMemo } from 'react';
import ContactsPanel from './ContactsPanel';
import MessagingPanel from './MessagingPanel';
import { User, Contact, SecureMessage, ShardGroup } from '../types';

interface CommunicationsViewProps {
  user: User;
  allUsers: User[];
  messages: SecureMessage[];
  selectedContact: Contact | undefined;
  onSelectContact: (contact: Contact) => void;
  onAddContact: (address: string, name: string) => void;
  onSendMessage: (text: string, isGroup?: boolean) => void;
  isChannelRunning: boolean;
  onUpdateUser: (user: User) => void;
  onObservePeer?: (contact: Contact) => void;
  // Group Specific
  groups: ShardGroup[];
  selectedGroup: ShardGroup | undefined;
  onSelectGroup: (group: ShardGroup) => void;
  onCreateGroup: (name: string, memberAddresses: string[]) => void;
}

const CommunicationsView: React.FC<CommunicationsViewProps> = ({
  user,
  allUsers,
  messages,
  selectedContact,
  onSelectContact,
  onAddContact,
  onSendMessage,
  isChannelRunning,
  onUpdateUser,
  onObservePeer,
  groups,
  selectedGroup,
  onSelectGroup,
  onCreateGroup
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const activeMessages = useMemo(() => {
    if (selectedGroup) {
      return messages.filter(m => m.receiverAddress === selectedGroup.id);
    }
    if (selectedContact) {
      return messages.filter(m => 
        (m.senderAddress === user.address && m.receiverAddress === selectedContact.address) ||
        (m.senderAddress === selectedContact.address && m.receiverAddress === user.address)
      );
    }
    return [];
  }, [messages, selectedContact, selectedGroup, user.address]);

  const handleSelectContact = (contact: Contact) => {
    setIsSyncing(true);
    onSelectContact(contact);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleSelectGroup = (group: ShardGroup) => {
    setIsSyncing(true);
    onSelectGroup(group);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const currentContextName = selectedGroup ? selectedGroup.name : selectedContact ? selectedContact.name : undefined;
  const currentContextId = selectedGroup ? selectedGroup.id : selectedContact ? selectedContact.address : undefined;

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 animate-in fade-in zoom-in-95 duration-700 overflow-hidden pb-4">
      {/* Sidebar: Registry Control */}
      <div className="w-full md:w-80 flex flex-col h-full shrink-0">
        <div className="flex flex-col h-full bg-zinc-900/60 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-8 border-b border-white/5 bg-black/20">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(247,147,26,0.5)]"></div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Lattice Social</h3>
             </div>
             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Shard Registry Active</p>
          </div>
          <ContactsPanel 
            contacts={user.contacts || []} 
            groups={groups || []}
            allUsers={allUsers}
            onAdd={onAddContact} 
            onSelect={handleSelectContact} 
            onSelectGroup={handleSelectGroup}
            onCreateGroup={onCreateGroup}
            selectedId={currentContextId} 
          />
        </div>
      </div>

      {/* Main Messaging: Entanglement Terminal */}
      <div className="flex-1 flex flex-col h-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-[4rem] blur opacity-10 group-hover:opacity-30 transition-all duration-1000"></div>
        <div className="relative flex-1 bg-zinc-900/40 border border-white/10 rounded-[3.5rem] p-10 flex flex-col h-full shadow-3xl overflow-hidden backdrop-blur-3xl">
          
          {/* Enhanced Chat Header */}
          <div className="absolute top-0 left-0 right-0 h-24 px-10 flex justify-between items-center z-20 border-b border-white/5 bg-black/10 backdrop-blur-md">
             {currentContextName ? (
               <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-black font-black text-xl italic shadow-2xl">
                   {selectedGroup ? 'Σ' : currentContextName.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">{currentContextName}</h2>
                      {!selectedGroup && selectedContact?.profileId && (
                        <span className="text-[10px] font-black text-orange-500 mono bg-black/40 px-2 py-0.5 rounded border border-orange-500/20">{selectedContact.profileId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isChannelRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        {selectedGroup ? `${selectedGroup.memberAddresses.length} Nodes Entangled` : 'Active Waveform'}
                      </span>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-zinc-800 rounded-full"></div>
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Awaiting Frequency Handshake...</span>
               </div>
             )}
             
             {selectedContact && (
               <button 
                onClick={() => onObservePeer?.(selectedContact)}
                className="bg-white/5 hover:bg-orange-500 hover:text-black border border-white/10 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
               >
                 Inspect Profile
               </button>
             )}
          </div>
          
          <div className="absolute top-28 left-0 right-0 flex justify-center z-30 pointer-events-none">
             {isSyncing && (
               <div className="bg-orange-500 text-black px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] animate-bounce shadow-3xl shadow-orange-500/30 border-4 border-black">
                 Synchronizing Entropy...
               </div>
             )}
          </div>

          <div className="mt-14 flex-1 flex flex-col min-h-0">
            <MessagingPanel 
              messages={activeMessages} 
              onSend={(text) => onSendMessage(text, !!selectedGroup)}
              canSend={isChannelRunning && !!currentContextId && !isSyncing}
              cost={user.role === 'admin' ? 0 : 0.000000000005}
              currentUserId={user.address}
              selectedContextName={currentContextName}
              isGroup={!!selectedGroup}
              messagingActive={user.messagingActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsView;
