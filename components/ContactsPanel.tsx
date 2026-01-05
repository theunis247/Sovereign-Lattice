
import React, { useState, useMemo } from 'react';
import { Contact, User, ShardGroup } from '../types';

interface ContactsPanelProps {
  contacts: Contact[];
  groups: ShardGroup[];
  allUsers: User[];
  onAdd: (address: string, name: string) => void;
  onSelect: (contact: Contact) => void;
  onSelectGroup: (group: ShardGroup) => void;
  onCreateGroup: (name: string, members: string[]) => void;
  selectedId?: string;
}

const ContactsPanel: React.FC<ContactsPanelProps> = ({ 
  contacts, groups, allUsers, onAdd, onSelect, onSelectGroup, onCreateGroup, selectedId 
}) => {
  const [activeTab, setActiveTab] = useState<'peers' | 'groups' | 'discover'>('peers');
  const [search, setSearch] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);

  const filteredDiscovery = useMemo(() => {
    if (activeTab !== 'discover') return [];
    return allUsers.filter(u => 
      u.discoveryVisible !== false && 
      !contacts.some(c => c.address === u.address) &&
      (
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.address.includes(search) ||
        u.profileId.toLowerCase().includes(search.toLowerCase())
      )
    ).slice(0, 10);
  }, [allUsers, contacts, search, activeTab]);

  const getAvatarGradient = (seed: string) => {
    const colors = ['#f7931a', '#3b82f6', '#a855f7', '#10b981', '#ef4444'];
    const s = seed || 'default';
    const idx1 = s.charCodeAt(0) % colors.length;
    const idx2 = s.charCodeAt(s.length - 1) % colors.length;
    return `linear-gradient(135deg, ${colors[idx1]} 0%, ${colors[idx2]} 100%)`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/40">
      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 bg-black/20 p-2">
        {(['peers', 'groups', 'discover'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === tab ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-white/5">
         <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors">🔍</span>
            <input 
              type="text" 
              placeholder={`Search by Name or ID...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-orange-500/40 transition-all placeholder:text-gray-700"
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {activeTab === 'peers' && (
          <>
            {contacts.length === 0 ? (
              <div className="text-center py-20 opacity-30 px-6">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">No node entanglements found.</p>
                <button onClick={() => setActiveTab('discover')} className="mt-4 text-orange-500 text-[9px] font-black uppercase hover:underline">Sync via Discovery</button>
              </div>
            ) : (
              contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.profileId?.toLowerCase().includes(search.toLowerCase())).map(contact => {
                const isSelected = selectedId === contact.address;
                return (
                  <button
                    key={contact.address}
                    onClick={() => onSelect(contact)}
                    className={`w-full p-4 rounded-3xl border transition-all duration-300 flex items-center gap-4 group ${isSelected ? 'bg-orange-500/10 border-orange-500/30' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
                  >
                    <div 
                      className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xl"
                      style={{ background: getAvatarGradient(contact.address) }}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-white uppercase tracking-tight">{contact.name}</span>
                        {contact.profileId && <span className="text-[7px] text-orange-500 font-bold mono">{contact.profileId}</span>}
                      </div>
                      <p className="text-[9px] text-gray-500 truncate max-w-[120px] font-medium">Synced {new Date(contact.addedAt).toLocaleDateString()}</p>
                    </div>
                    {isSelected && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_#f7931a]"></div>}
                  </button>
                );
              })
            )}
          </>
        )}

        {activeTab === 'groups' && (
          <>
            {isCreatingGroup ? (
              <div className="bg-zinc-900 border border-blue-500/30 p-6 rounded-[2.5rem] space-y-4 animate-in slide-in-from-top-4">
                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Establish Shard Cluster</h4>
                 <input 
                  type="text" placeholder="Cluster Designation" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500/50"
                 />
                 <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                    {contacts.map(c => (
                      <label key={c.address} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" checked={selectedForGroup.includes(c.address)}
                          onChange={() => setSelectedForGroup(prev => prev.includes(c.address) ? prev.filter(a => a !== c.address) : [...prev, c.address])}
                        />
                        <span className="text-[10px] font-bold text-gray-400">{c.name}</span>
                      </label>
                    ))}
                 </div>
                 <button 
                  onClick={() => { onCreateGroup(newGroupName, selectedForGroup); setIsCreatingGroup(false); }}
                  className="w-full py-3 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all"
                 >
                  Finalize Cluster
                 </button>
                 <button onClick={() => setIsCreatingGroup(false)} className="w-full text-[8px] text-gray-600 font-black uppercase">Abort</button>
              </div>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={() => setIsCreatingGroup(true)}
                  className="w-full p-4 bg-blue-500/10 border border-dashed border-blue-500/30 rounded-3xl text-[9px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-all mb-4"
                >
                  + New Shard Cluster
                </button>
                {groups.map(group => {
                   const isSelected = selectedId === group.id;
                   return (
                    <button
                      key={group.id}
                      onClick={() => onSelectGroup(group)}
                      className={`w-full p-4 rounded-3xl border transition-all duration-300 flex items-center gap-4 group ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
                    >
                      <div 
                        className="w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xl"
                        style={{ background: getAvatarGradient(group.id) }}
                      >
                        Σ
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-[11px] font-black text-white uppercase tracking-tight block">{group.name}</span>
                        <p className="text-[9px] text-gray-500 font-medium">{group.memberAddresses.length} Entangled Nodes</p>
                      </div>
                      {isSelected && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>}
                    </button>
                   );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-3">
             <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-[2rem] text-center">
                <p className="text-[8px] text-orange-500 font-black uppercase tracking-[0.4em]">Live Lattice Registry</p>
                <p className="text-[7px] text-gray-500 mt-1 uppercase">Scanning universal frequencies for active nodes.</p>
             </div>
             {filteredDiscovery.map(user => (
               <div key={user.address} className="bg-zinc-900/60 border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:border-orange-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: getAvatarGradient(user.address) }}>
                       {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-white uppercase">{user.username}</span>
                         <span className="text-[8px] text-orange-500 font-black mono">{user.profileId}</span>
                       </div>
                       <span className="text-[7px] text-gray-600 block mono truncate max-w-[100px]">{user.address}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAdd(user.address, user.username)}
                    className="p-2 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black rounded-xl transition-all"
                  >
                     <span className="text-lg leading-none">+</span>
                  </button>
               </div>
             ))}
             {filteredDiscovery.length === 0 && search && (
               <div className="text-center py-10 opacity-20 italic text-[10px] font-black">No matching nodes on this frequency.</div>
             )}
          </div>
        )}
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5">
          <div className="flex justify-between items-center opacity-40">
             <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Protocol Version</span>
             <span className="text-[9px] font-black text-white mono">3.1.2-STABLE</span>
          </div>
      </div>
    </div>
  );
};

export default ContactsPanel;
