
import React, { useState, useMemo, useEffect } from 'react';
import { User, LatticePool } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { QBS_UNITS } from '../services/quantumLogic';

interface MarketViewProps {
  user: User;
  pool: LatticePool;
  onSwap: (fromUnit: 'QRK' | 'USD', amount: number) => void;
  onStake: (amount: number, unit: 'QBS' | 'SHD' | 'QRK') => void;
  onPurchase: (usdAmount: number) => void;
}

const MarketView: React.FC<MarketViewProps> = ({ user, pool, onSwap, onStake, onPurchase }) => {
  const [fromUnit, setFromUnit] = useState<'QRK' | 'USD'>('QRK');
  const [amount, setAmount] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeUnit, setStakeUnit] = useState<'QBS' | 'SHD' | 'QRK'>('QBS');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [chartData, setChartData] = useState<{ time: string, price: number }[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const BTC_DONATION_ADDR = "bc1q0lzr6pfs24qt0f9qwhlhalhyjtfrhp9qz0esd3";
  const QUARKS_PER_TOKEN = QBS_UNITS.QRK; 

  useEffect(() => {
    // Generate simulated historical data
    const data = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      data.push({
        time: new Date(now - i * 3600000).toLocaleTimeString([], { hour: '2-digit' }),
        price: (pool.lastPrice / QUARKS_PER_TOKEN) * (0.95 + Math.random() * 0.1)
      });
    }
    setChartData(data);
  }, [pool.lastPrice]);

  const currentPricePerQuark = pool.lastPrice / QUARKS_PER_TOKEN;

  const swapCalculation = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return { output: 0, priceImpact: 0 };

    if (fromUnit === 'QRK') {
      const qbsDelta = amt / QUARKS_PER_TOKEN;
      const newQbsReserve = pool.qbsReserve + qbsDelta;
      const newUsdReserve = pool.kConstant / newQbsReserve;
      const output = pool.usdReserve - newUsdReserve;
      const priceImpact = ((output / amt) / currentPricePerQuark - 1) * 100;
      return { output, priceImpact: Math.abs(priceImpact) };
    } else {
      const newUsdReserve = pool.usdReserve + amt;
      const newQbsReserve = pool.kConstant / newUsdReserve;
      const qbsDelta = pool.qbsReserve - newQbsReserve;
      const output = qbsDelta * QUARKS_PER_TOKEN;
      const priceImpact = ((amt / output) / currentPricePerQuark - 1) * 100;
      return { output, priceImpact: Math.abs(priceImpact) };
    }
  }, [amount, fromUnit, pool, currentPricePerQuark]);

  const stakeImpact = useMemo(() => {
    const amt = parseFloat(stakeAmount) || 0;
    if (amt <= 0) return { priceIncrease: 0, newPrice: currentPricePerQuark };

    let qbsToStake = 0;
    if (stakeUnit === 'QBS') qbsToStake = amt;
    else if (stakeUnit === 'SHD') qbsToStake = amt / QBS_UNITS.SHD;
    else if (stakeUnit === 'QRK') qbsToStake = amt / QBS_UNITS.QRK;

    const newLiquidReserve = pool.qbsReserve - qbsToStake;
    if (newLiquidReserve <= 0) return { priceIncrease: 999, newPrice: 999 };

    const newPricePerQBS = pool.usdReserve / newLiquidReserve;
    const newPricePerQRK = newPricePerQBS / QUARKS_PER_TOKEN;
    const priceIncrease = ((newPricePerQRK / currentPricePerQuark) - 1) * 100;

    return { priceIncrease, newPrice: newPricePerQRK };
  }, [stakeAmount, stakeUnit, pool, currentPricePerQuark]);

  const handlePurchaseClick = async () => {
    const usd = parseFloat(purchaseAmount);
    if (isNaN(usd) || usd <= 0) return;
    
    setIsPurchasing(true);
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    onPurchase(usd);
    setPurchaseAmount('');
    setIsPurchasing(false);
  };

  const handleCopyBtc = () => {
    navigator.clipboard.writeText(BTC_DONATION_ADDR);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
           
           {/* Price Charting Engine */}
           <div className="bg-zinc-900/60 border border-white/10 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden h-[400px] shrink-0">
              <div className="absolute top-8 left-8 z-10">
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter">QRK / USD Analytics</h2>
                 <p className="text-[10px] text-orange-500 font-bold tracking-[0.4em] uppercase">AMM Spot Pricing v4.1</p>
              </div>
              <div className="absolute top-8 right-8 z-10 text-right">
                 <span className="block text-[8px] text-gray-500 font-black uppercase mb-1">Spot Price</span>
                 <span className="text-3xl font-black text-green-500 mono">${currentPricePerQuark.toFixed(4)}</span>
              </div>
              
              <div className="absolute inset-0 pt-24 pb-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#f7931a" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          labelStyle={{ color: '#666', fontSize: '10px' }}
                          itemStyle={{ color: '#f7931a', fontSize: '12px', fontWeight: 'bold' }}
                       />
                       <Area type="monotone" dataKey="price" stroke="#f7931a" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Direct Fiat Gateway Module */}
           <div className="bg-zinc-900/80 border border-green-500/30 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[60px]"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="space-y-4 max-w-sm">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                          <span className="text-xl font-black text-black">$</span>
                       </div>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Fiat On-Ramp</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                      Acquire Quarks instantly. Every <span className="text-white font-black">$1.00 USD</span> provides exactly <span className="text-green-500 font-black">1.00 Sovereign Quark</span>. No hidden fees. Direct profile settlement.
                    </p>
                    <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 inline-flex items-center gap-2">
                       <span className="text-[8px] text-gray-500 font-black uppercase">Exchange Rate:</span>
                       <span className="text-[10px] text-green-500 font-black mono">$1 = 1 QRK</span>
                    </div>
                 </div>
                 
                 <div className="bg-black/60 p-6 rounded-[2.5rem] border border-white/10 w-full md:w-80 space-y-4">
                    <div className="space-y-1">
                       <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest px-2">Investment Amount (USD)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-black">$</span>
                          <input 
                             type="number" 
                             placeholder="0.00"
                             value={purchaseAmount}
                             onChange={(e) => setPurchaseAmount(e.target.value)}
                             disabled={isPurchasing}
                             className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl p-4 pl-8 text-sm text-white outline-none focus:border-green-500/50"
                          />
                       </div>
                    </div>

                    <button 
                       onClick={handlePurchaseClick}
                       disabled={!purchaseAmount || parseFloat(purchaseAmount) <= 0 || isPurchasing}
                       className="w-full py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-green-500 shadow-xl shadow-green-500/20 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                       {isPurchasing ? (
                          <>
                             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Settling Transaction...
                          </>
                       ) : (
                          `Pay $${parseFloat(purchaseAmount || '0').toLocaleString()} to Receive QRK`
                       )}
                    </button>
                    
                    <div className="flex justify-center gap-4 opacity-40">
                       <span className="text-[7px] font-black text-gray-500 uppercase">Visa</span>
                       <span className="text-[7px] font-black text-gray-500 uppercase">Mastercard</span>
                       <span className="text-[7px] font-black text-gray-500 uppercase">Apple Pay</span>
                       <span className="text-[7px] font-black text-gray-500 uppercase">Lattice Link</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Support the Vision / Bitcoin Donation */}
           <div className="bg-zinc-900/60 border border-orange-500/20 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(247,147,26,0.05),transparent_40%)]"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="w-24 h-24 bg-orange-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-500/20 group-hover:rotate-12 transition-transform duration-500">
                    <span className="text-5xl font-black text-black italic">₿</span>
                 </div>
                 <div className="flex-1 space-y-4 text-center md:text-left">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Support the Project</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                       The Sovereign Lattice is an open-source frontier. If you believe in decentralized scientific resolution, consider contributing to the core infrastructure. All donations fuel further neural-compute R&D.
                    </p>
                 </div>
                 <div className="w-full md:w-auto">
                    <div className="bg-black/60 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                       <span className="text-[9px] text-orange-500 font-black uppercase tracking-[0.4em] block text-center">BTC Wallet Address</span>
                       <div className="bg-zinc-900 p-4 rounded-2xl border border-orange-500/20 flex flex-col gap-2 items-center">
                          <code className="text-[10px] text-orange-400 font-black mono break-all text-center leading-relaxed">
                            {BTC_DONATION_ADDR}
                          </code>
                          <button 
                            onClick={handleCopyBtc}
                            className={`mt-2 px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all flex items-center gap-2 ${copyFeedback ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                          >
                             {copyFeedback ? '✓ COPIED TO CLIPBOARD' : 'COPY BTC ADDRESS'}
                          </button>
                       </div>
                       <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest text-center">Immutable Support // Forever Etched</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Liquidity Staking Module */}
           <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden mb-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                 <div className="space-y-4 max-w-md">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Lattice Entropy Staking</h3>
                    <p className="text-[11px] text-blue-200 leading-relaxed font-medium">
                      Lock your breakthrough magnitude (QBS) into the network's liquidity vaults. Committing magnitude <span className="text-blue-400 font-black">reduces circulating supply</span>, increasing the spot price of Quarks for the entire lattice.
                    </p>
                    <div className="flex gap-4">
                       <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                          <span className="block text-[7px] text-gray-500 font-black uppercase">Staking Reward</span>
                          <span className="text-xl font-black text-green-400">12.4% <span className="text-[8px] uppercase">APY</span></span>
                       </div>
                       <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                          <span className="block text-[7px] text-gray-500 font-black uppercase">Staked Balance</span>
                          <span className="text-xl font-black text-blue-400">{(user.stakedBalance || 0).toFixed(4)} QBS</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-black/60 p-6 rounded-[2.5rem] border border-white/10 w-full md:w-80 space-y-4">
                    <div className="space-y-1">
                       <div className="flex justify-between items-center px-2">
                          <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Commit Magnitude</label>
                          <div className="flex gap-1">
                             {(['QBS', 'SHD', 'QRK'] as const).map(u => (
                                <button 
                                  key={u} 
                                  onClick={() => setStakeUnit(u)}
                                  className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase transition-all ${stakeUnit === u ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-600 hover:text-white'}`}
                                >
                                   {u}
                                </button>
                             ))}
                          </div>
                       </div>
                       <input 
                          type="number" 
                          placeholder="0.00"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50"
                       />
                    </div>
                    
                    {parseFloat(stakeAmount) > 0 && (
                       <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] text-gray-500 font-black uppercase">Supply Squeeze</span>
                             <span className="text-[9px] text-green-400 font-black">+{stakeImpact.priceIncrease.toFixed(4)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] text-gray-500 font-black uppercase">Target Price</span>
                             <span className="text-[9px] text-blue-400 font-bold mono">${stakeImpact.newPrice.toFixed(6)}</span>
                          </div>
                       </div>
                    )}

                    <button 
                       onClick={() => {
                          onStake(parseFloat(stakeAmount), stakeUnit);
                          setStakeAmount('');
                       }}
                       disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
                       className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-30"
                    >
                       Commit to Vault
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Warp Swap Module */}
        <div className="lg:col-span-4 flex flex-col bg-zinc-900/60 border border-white/10 rounded-[3rem] shadow-2xl p-8 sticky top-0">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em]">Warp Swap Interface</h3>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[8px] text-gray-600 mono">L2 Warp-Sync Active</span>
              </div>
           </div>

           <div className="space-y-4">
              <div className="bg-black/60 p-6 rounded-[2.5rem] border border-white/5 relative group transition-colors focus-within:border-orange-500/30">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Pay</span>
                    <span className="text-[8px] text-gray-600 font-black uppercase">
                       {fromUnit === 'QRK' ? Math.round(user.balance * QUARKS_PER_TOKEN).toLocaleString() : `$${(user.usdBalance || 0).toLocaleString()}`} Max
                    </span>
                 </div>
                 <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-3xl font-black text-white outline-none placeholder:text-gray-800"
                    />
                    <button 
                      onClick={() => setFromUnit(fromUnit === 'QRK' ? 'USD' : 'QRK')}
                      className="px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black text-orange-500 border border-white/10 hover:bg-zinc-700 transition-all shadow-lg"
                    >
                       {fromUnit}
                    </button>
                 </div>
              </div>

              <div className="flex justify-center -my-3 relative z-10">
                 <button 
                   onClick={() => setFromUnit(fromUnit === 'QRK' ? 'USD' : 'QRK')}
                   className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center border-4 border-black text-black text-lg hover:rotate-180 transition-transform duration-500 shadow-2xl shadow-orange-500/20"
                 >
                    ⇄
                 </button>
              </div>

              <div className="bg-black/60 p-6 rounded-[2.5rem] border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Receive (Est)</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 text-3xl font-black text-white opacity-40">
                       {swapCalculation.output.toLocaleString(undefined, { maximumFractionDigits: fromUnit === 'QRK' ? 2 : 0 })}
                    </div>
                    <div className="px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black text-blue-400 border border-white/10 shadow-lg">
                       {fromUnit === 'QRK' ? 'USD' : 'QRK'}
                    </div>
                 </div>
              </div>

              {parseFloat(amount) > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-[2rem] space-y-3 animate-in slide-in-from-top-4 duration-300">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-gray-500">Rate</span>
                      <span className="text-white">1 {fromUnit} = {(fromUnit === 'QRK' ? swapCalculation.output / parseFloat(amount) : swapCalculation.output / parseFloat(amount)).toFixed(6)} {fromUnit === 'QRK' ? 'USD' : 'QRK'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-gray-500">Price Impact</span>
                      <span className={swapCalculation.priceImpact > 1 ? 'text-red-500' : 'text-green-500'}>
                         {swapCalculation.priceImpact.toFixed(4)}%
                      </span>
                   </div>
                </div>
              )}
           </div>

           <button 
             onClick={() => onSwap(fromUnit, parseFloat(amount))}
             disabled={!amount || parseFloat(amount) <= 0}
             className={`mt-12 w-full py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 ${
               amount && parseFloat(amount) > 0 
                ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/40' 
                : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
             }`}
           >
              Execute Warp Swap
           </button>
        </div>
      </div>
    </div>
  );
};

export default MarketView;
