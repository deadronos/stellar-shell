import React from 'react';
import { useStore } from '../state/store';
import { UPGRADES } from '../data/upgrades';

export const UpgradesPanel = () => {
  const isUpgradesOpen = useStore((state) => state.isUpgradesOpen);
  const toggleUpgrades = useStore((state) => state.toggleUpgrades);
  const upgrades = useStore((state) => state.upgrades);
  const purchaseUpgrade = useStore((state) => state.purchaseUpgrade);
  const matter = useStore((state) => state.matter);
  const rareMatter = useStore((state) => state.rareMatter);
  const research = useStore((state) => state.research);

  if (!isUpgradesOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrades-panel-title"
        className="bg-gray-900 border border-white/20 rounded-xl p-6 w-96 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="upgrades-panel-title" className="text-xl font-bold text-white tracking-widest uppercase">Upgrades</h2>
          <button
            onClick={toggleUpgrades}
            aria-label="Close upgrades panel"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {UPGRADES.map((def) => {
            const purchased = upgrades[def.id];
            const canAfford =
              matter >= def.matterCost &&
              rareMatter >= def.rareMatterCost &&
              research >= def.researchCost;

            return (
              <div
                key={def.id}
                className={`p-3 rounded-lg border transition-all ${
                  purchased
                    ? 'border-emerald-500/50 bg-emerald-900/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{def.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{def.description}</div>
                    {!purchased && (
                      <div className="flex gap-3 mt-1 text-xs">
                        {def.matterCost > 0 && (
                          <span className={matter >= def.matterCost ? 'text-cyan-400' : 'text-red-400'}>
                            {def.matterCost} matter
                          </span>
                        )}
                        {def.rareMatterCost > 0 && (
                          <span className={rareMatter >= def.rareMatterCost ? 'text-purple-400' : 'text-red-400'}>
                            {def.rareMatterCost} rare
                          </span>
                        )}
                        {def.researchCost > 0 && (
                          <span className={research >= def.researchCost ? 'text-teal-400' : 'text-red-400'}>
                            {def.researchCost} research
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {purchased ? (
                    <span className="text-emerald-400 text-xs font-bold shrink-0">✓ Owned</span>
                  ) : (
                    <button
                      onClick={() => purchaseUpgrade(def.id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                        canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,200,255,0.3)]'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          Upgrades reset on System Jump
        </div>
      </div>
    </div>
  );
};
