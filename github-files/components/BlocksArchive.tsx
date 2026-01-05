
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SolvedBlock, ScientificAdvance, User, ScientificDossier, SovereignGrade, EvolutionProgress } from '../types';
import { getCosmicDomain, formatCurrency, GRADE_COLORS } from '../services/quantumLogic';
import LatticeLogo from './LatticeLogo';
import EvolutionProgressModal from './EvolutionProgressModal';
import PDFExportModal from './PDFExportModal';

interface BlocksArchiveProps {
  blocks: SolvedBlock[];
  onGenerateDossier: (blockId: string) => void;
  isGeneratingDossier: boolean;
  onExportNft?: (block: SolvedBlock) => void;
  currentUser?: User;
  // Evolution progress props
  isEvolvingBreakthrough?: Record<string, boolean>;
  evolutionProgress?: Record<string, EvolutionProgress>;
  onCancelEvolution?: (blockId: string) => void;
}

const ScientificHUD: React.FC<{ formula?: string; constants?: Record<string, string>; interpretation?: string }> = ({ formula, constants, interpretation }) => {
  return (
    <div className="bg-black/80 border border-green-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.1)] relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="p-8 space-y-8 relative z-10">
         <div className="flex justify-between items-center border-b border-green-500/20 pb-4">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em]">Sovereign Mathematical Engine</span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500/40"></div>
            </div>
         </div>

         {formula && (
           <div className="text-center py-6">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-4">The Unified Shard Equation</span>
              <div className="bg-green-500/5 p-8 rounded-3xl border border-green-500/10 inline-block min-w-[300px]">
                 <p className="text-2xl font-black text-green-400 mono italic tracking-tight select-all">
                    {formula}
                 </p>
              </div>
           </div>
         )}

         {constants && Object.keys(constants).length > 0 && (
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(constants).map(([key, value]) => (
                <div key={key} className="bg-black/40 border border-white/5 p-4 rounded-2xl group hover:border-green-500/30 transition-colors">
                   <span className="block text-[8px] text-gray-600 font-black uppercase mb-1 tracking-widest">{key.replace(/_/g, ' ')}</span>
                   <span className="text-[10px] font-bold text-green-300 mono">{value}</span>
                </div>
              ))}
           </div>
         )}

         {interpretation && (
           <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5">
              <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest block mb-3">Neural Interpretation</span>
              <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
                 "{interpretation}"
              </p>
           </div>
         )}
      </div>
    </div>
  );
};

const NFTCertificateTemplate: React.FC<{ block: SolvedBlock; currentUser?: User }> = ({ block, currentUser }) => {
  const domain = getCosmicDomain(Math.floor(block.shardIndex / 1000) + 1);
  const serialNumber = `LQBS-2025-${block.shardIndex.toString().padStart(5, '0')}-${block.hash.substring(0, 10).toUpperCase()}`;
  const goldPrimary = "#C5A059";
  const goldDark = "#8E6E37";

  return (
    <div 
      id="certificate-payload"
      className="bg-white text-black relative flex flex-col p-0 overflow-hidden border-[16px] border-double" 
      style={{ 
        width: '210mm',
        height: '297mm',
        borderColor: goldPrimary,
        display: 'flex',
        boxSizing: 'border-box',
        fontFamily: "'Space Grotesk', sans-serif"
      }}
    >
      {/* Visual content of certificate stays high quality */}
      <div className="relative z-10 pt-10 px-16 flex justify-between items-end border-b-4 border-double border-[#ddd] pb-4 mx-8">
        <div className="space-y-0.5 text-left">
           <h4 className="text-[11px] font-black tracking-[0.6em] text-gray-500 uppercase">Lattice Sovereign Authority</h4>
           <h3 className="text-3xl font-black italic tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>Resolution Certificate</h3>
        </div>
      </div>
      {/* ...rest of certificate logic */}
    </div>
  );
};

const BlocksArchive: React.FC<BlocksArchiveProps> = ({ 
  blocks, 
  onGenerateDossier, 
  isGeneratingDossier, 
  currentUser,
  isEvolvingBreakthrough = {},
  evolutionProgress = {},
  onCancelEvolution
}) => {
  const [printingBlock, setPrintingBlock] = useState<SolvedBlock | null>(null);
  const [detailedBlock, setDetailedBlock] = useState<SolvedBlock | null>(null);
  const [evolvingId, setEvolvingId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle export completion feedback
  const handleExportComplete = (success: boolean) => {
    setExportSuccess(success);
    if (success) {
      // Show success message briefly
      setTimeout(() => setExportSuccess(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-700 h-full overflow-hidden">
      
      {/* DETAILED VIEW OVERLAY - IMPROVED FOR SCIENCE */}
      {detailedBlock && (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="bg-zinc-900 border border-orange-500/30 rounded-[4rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
              
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-zinc-950 border border-orange-500/30 rounded-2xl flex items-center justify-center shadow-xl">
                       <LatticeLogo size="lg" />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Laboratory Audit</h2>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">REGISTRY: {detailedBlock.shardId}</span>
                          <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase`} style={{ borderColor: GRADE_COLORS[detailedBlock.grade || 'B'], color: GRADE_COLORS[detailedBlock.grade || 'B'] }}>
                             Tier Mk {detailedBlock.advancementLevel || 1}
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                       onClick={() => setDetailedBlock(null)}
                       className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500/20 text-white text-3xl font-bold transition-all"
                    >×</button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-12">
                       <section className="space-y-6">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-orange-500 pl-4">Calculated Result</h3>
                          <ScientificHUD 
                            formula={detailedBlock.primaryFormula} 
                            constants={detailedBlock.observedConstants} 
                            interpretation={detailedBlock.neuralInterpretation}
                          />
                       </section>

                       <section className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-blue-500 pl-4">Abstract Context</h3>
                          <div className="bg-black/40 p-10 rounded-[3rem] border border-white/5 space-y-6 shadow-inner">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Theoretical Resolution</label>
                                <p className="text-lg text-gray-300 font-medium italic leading-relaxed">"{detailedBlock.explanation}"</p>
                             </div>
                          </div>
                       </section>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                       <section className="bg-black/40 border border-white/10 p-10 rounded-[3.5rem] space-y-10">
                          <h3 className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Validation Profile</h3>
                          
                          <div className="grid grid-cols-2 gap-6">
                             <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5">
                                <span className="block text-[8px] text-gray-600 font-black uppercase mb-1">Impact Score</span>
                                <span className="text-3xl font-black text-orange-500 mono">{detailedBlock.breakthroughScore || 0}<span className="text-sm text-gray-700">/100</span></span>
                             </div>
                             <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5">
                                <span className="block text-[8px] text-gray-600 font-black uppercase mb-1">Operational Yield</span>
                                <span className="text-xl font-black text-green-500 mono">{detailedBlock.payoutPerShard}</span>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest px-1">Integrity Signature</label>
                                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-[9px] font-mono text-gray-500 break-all leading-relaxed select-all">
                                   {detailedBlock.hash}
                                </div>
                             </div>
                             
                             {/* Additional Details */}
                             <div className="space-y-3">
                                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
                                   <span className="block text-[8px] text-gray-600 font-black uppercase mb-2">Timestamp</span>
                                   <span className="text-sm text-white font-mono">{detailedBlock.timestamp}</span>
                                </div>
                                
                                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
                                   <span className="block text-[8px] text-gray-600 font-black uppercase mb-2">Block ID</span>
                                   <span className="text-sm text-white font-mono break-all">{detailedBlock.id}</span>
                                </div>
                                
                                {detailedBlock.consensusCritique && (
                                   <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
                                      <span className="block text-[8px] text-gray-600 font-black uppercase mb-2">Peer Review</span>
                                      <p className="text-xs text-gray-300 italic leading-relaxed">
                                         "{detailedBlock.consensusCritique}"
                                      </p>
                                   </div>
                                )}
                             </div>
                          </div>
                       </section>

                       {/* Export Actions */}
                       <section className="bg-black/40 border border-amber-500/20 p-8 rounded-[3.5rem] space-y-6">
                          <h3 className="text-center text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Certificate Export</h3>
                          
                          <div className="space-y-4">
                             <button 
                                onClick={() => {
                                   setPrintingBlock(detailedBlock);
                                   setDetailedBlock(null);
                                }}
                                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:from-amber-500 hover:to-amber-400 transition-all shadow-xl"
                             >
                                🏆 Export Premium Certificate
                             </button>
                             
                             <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                                Generate a museum-quality PDF certificate with blockchain verification, 
                                security features, and professional formatting suitable for framing.
                             </p>
                          </div>
                       </section>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-black/60 border-t border-white/5 flex justify-center shrink-0">
                 <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em]">CERTIFIED QUANTUM DATA // SOVEREIGN LATTICE REGISTRY</p>
              </div>
           </div>
        </div>
      )}
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-zinc-900/60 border border-white/10 p-10 rounded-[3.5rem] shrink-0 shadow-3xl">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Discovery Archive</h2>
          <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.4em]">Hardened Scientific Records</p>
        </div>
        <div className="bg-black/40 px-10 py-5 rounded-[2.5rem] border border-white/5">
           <span className="text-3xl font-black text-orange-500 mono">{blocks.length}</span>
           <span className="text-[10px] text-gray-600 font-black uppercase ml-4 tracking-widest">Resolutions Etched</span>
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40 px-6">
          {[...blocks].reverse().map((block) => (
            <div key={block.id} className="bg-zinc-900/60 border border-white/10 p-8 rounded-[3.5rem] flex flex-col gap-6 group hover:bg-zinc-900/90 transition-all shadow-xl h-[650px] relative overflow-hidden">
              
              <div className="flex justify-between items-start">
                <div>
                   <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: GRADE_COLORS[block.grade || 'B'] }}>MK {block.advancementLevel || 1} Shard</span>
                   <h3 className="text-lg font-black text-white uppercase italic leading-tight mt-2">{getCosmicDomain(Math.floor(block.shardIndex / 1000) + 1)}</h3>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border border-white/10`} style={{ backgroundColor: GRADE_COLORS[block.grade || 'B'], color: 'white' }}>
                   {block.grade || 'B'}
                </div>
              </div>

              {block.primaryFormula && (
                <div className="bg-black/60 p-4 rounded-2xl border border-green-500/20 text-center shadow-inner overflow-hidden">
                   <p className="text-[10px] font-bold text-green-400 mono italic truncate">{block.primaryFormula}</p>
                </div>
              )}

              <div className="flex-1 bg-black/60 p-6 rounded-[2.5rem] border border-white/5 text-xs text-gray-400 italic leading-relaxed overflow-y-auto custom-scrollbar shadow-inner">
                 "{block.explanation.substring(0, 150)}..."
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setDetailedBlock(block)}
                  className="py-4 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black border border-orange-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all"
                >
                  Inspect Equations
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onGenerateDossier(block.id)} 
                    disabled={isGeneratingDossier || isEvolvingBreakthrough[block.id]}
                    className={`py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                      isEvolvingBreakthrough[block.id] 
                        ? 'bg-purple-600/20 text-purple-400 border-purple-500/30 animate-pulse' 
                        : 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isEvolvingBreakthrough[block.id] ? 'Evolving...' : 'Evolve'}
                  </button>
                  <button 
                    onClick={() => setPrintingBlock(block)} 
                    className="py-4 bg-white/5 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution Progress Modals */}
      {Object.entries(evolutionProgress).map(([blockId, progress]) => (
        <EvolutionProgressModal
          key={blockId}
          isOpen={isEvolvingBreakthrough[blockId] || false}
          progress={progress}
          onCancel={onCancelEvolution ? () => onCancelEvolution(blockId) : undefined}
        />
      ))}

      {/* PDF Export Modal */}
      {printingBlock && currentUser && (
        <PDFExportModal
          isOpen={!!printingBlock}
          block={printingBlock}
          currentUser={currentUser}
          onClose={() => setPrintingBlock(null)}
          onExportComplete={handleExportComplete}
        />
      )}

      {/* Export Success Notification */}
      {exportSuccess !== null && (
        <div className={`fixed top-6 right-6 z-[4000] p-4 rounded-2xl border shadow-xl animate-in slide-in-from-right duration-500 ${
          exportSuccess 
            ? 'bg-green-900/90 border-green-500/30 text-green-300' 
            : 'bg-red-900/90 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {exportSuccess ? '✅' : '❌'}
            </span>
            <div>
              <div className="font-black text-sm uppercase tracking-wider">
                {exportSuccess ? 'Export Successful!' : 'Export Failed'}
              </div>
              <div className="text-xs opacity-80">
                {exportSuccess 
                  ? 'Premium certificate downloaded to your device' 
                  : 'Please try again or check your browser settings'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlocksArchive;
