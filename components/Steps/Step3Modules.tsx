import React, { useState } from 'react';
import { LSContextType, BloomLevel, DeliveryModeType, LSModule, LSContent, LearningObjective } from '../../types';
import { DELIVERY_MODE_ICONS, DELIVERY_MODE_LABELS } from '../../constants';
import { Trash2, Plus, ChevronDown, ChevronUp, ChevronRight, Link as LinkIcon, Box, FileText, CornerDownRight, PenLine, ArrowUp, ArrowDown, X, Search, Check, ExternalLink, ListTree, FoldVertical, UnfoldVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- Sub-component: Delivery Mode Modal ---
const DeliveryModeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedModes: DeliveryModeType[];
  onToggleMode: (mode: DeliveryModeType) => void;
}> = ({ isOpen, onClose, selectedModes, onToggleMode }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredModes = Object.values(DeliveryModeType).filter(mode => {
    const label = t(`deliveryModes.${mode}` as any) || DELIVERY_MODE_LABELS[mode];
    return label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 text-itu-blue">
          <h3 className="font-bold text-lg">{t('step3.selectModes')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-slate-100 bg-white shadow-sm z-10">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus type="text" placeholder={t('step3.search')} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-itu-cyan focus:ring-2 focus:ring-itu-cyan/20 outline-none text-sm transition-all" />
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-grow bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredModes.map(mode => {
              const isSelected = selectedModes.includes(mode);
              return (
                <button
                  key={mode}
                  onClick={() => onToggleMode(mode)}
                  className={`flex items-center p-3 rounded-lg border text-left text-sm transition-all duration-200 ${isSelected ? 'bg-itu-blue border-itu-blue text-white shadow-md' : 'bg-white border-slate-200 hover:border-itu-cyan hover:shadow-sm text-slate-700'}`}
                >
                  <div className="mr-3 shrink-0">{DELIVERY_MODE_ICONS[mode]}</div>
                  <span className="truncate flex-grow items-center font-medium">{t(`deliveryModes.${mode}` as any) || DELIVERY_MODE_LABELS[mode]}</span>
                  {isSelected && <Check className="w-4 h-4 ml-2 shrink-0" />}
                </button>
              )
            })}
            {filteredModes.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                {t('step3.noModeFound')} "{search}"
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-itu-blue text-white rounded-lg hover:bg-blue-800 transition-all font-bold tracking-wide shadow-md hover:shadow-lg">
            {t('step3.done')}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Sub-component: Content Fields (Reusable for Content and SubContent) ---
const ContentFields: React.FC<{
  content: LSContent;
  onUpdate: (data: Partial<LSContent>) => void;
}> = ({ content, onUpdate }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleDeliveryMode = (mode: DeliveryModeType) => {
    const modes = content.deliveryModes.includes(mode)
      ? content.deliveryModes.filter(m => m !== mode)
      : [...content.deliveryModes, mode];

    // Clean up links if mode is removed
    const newLinks = { ...content.deliveryLinks };
    if (!modes.includes(mode)) {
      delete newLinks[mode];
    }

    // Reset custom delivery mode text if OTHER is removed
    let customText = content.customDeliveryMode;
    if (mode === DeliveryModeType.OTHER && !modes.includes(mode)) {
      customText = undefined;
    }

    onUpdate({ deliveryModes: modes, deliveryLinks: newLinks, customDeliveryMode: customText });
  };

  const updateLink = (mode: string, url: string) => {
    onUpdate({ deliveryLinks: { ...content.deliveryLinks, [mode]: url } });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Title & Duration */}
        <div className="md:col-span-8">
          <label className="block text-xs font-bold text-slate-500 tracking-wide mb-1.5">{t('step3.contentTitle')}</label>
          <input
            type="text"
            value={content.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t('step3.contentTitlePlace')}
            className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 focus:border-itu-cyan focus:ring-1 focus:ring-itu-cyan outline-none transition-all"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs font-bold text-slate-500 tracking-wide mb-1.5">{t('step3.durationMin')}</label>
          <input
            type="number"
            value={content.duration ?? ''}
            onChange={(e) => onUpdate({ duration: e.target.value === '' ? undefined : (parseInt(e.target.value, 10) || 0) })}
            className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 focus:border-itu-cyan focus:ring-1 focus:ring-itu-cyan outline-none transition-all"
          />
        </div>

        {/* Delivery Modes & Links */}
        <div className="md:col-span-12">
          <label className="block text-xs font-bold text-slate-500 tracking-wide mb-2">{t('step3.deliveryLinks')}</label>

          <div className="space-y-3">
            {content.deliveryModes.length === 0 ? (
              <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-slate-200 border-dashed text-center">{t('step3.noDeliverySelected')}</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {content.deliveryModes.map(mode => {
                  const isOther = mode === DeliveryModeType.OTHER;
                  const linkUrl = content.deliveryLinks[mode];
                  return (
                    <div key={mode} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-colors">
                      <div className="flex items-center space-x-3 min-w-[200px]">
                        <span className="text-itu-blue p-2 bg-blue-50/80 border border-blue-100 rounded-md shadow-sm">{DELIVERY_MODE_ICONS[mode]}</span>
                        <span className="text-sm font-bold text-slate-700 truncate">{t(`deliveryModes.${mode}` as any) || DELIVERY_MODE_LABELS[mode]}</span>
                      </div>

                      <div className="flex-grow flex flex-col sm:flex-row gap-2 w-full">
                        {isOther && (
                          <input type="text" value={content.customDeliveryMode || ''} onChange={(e) => onUpdate({ customDeliveryMode: e.target.value })} placeholder={t('step3.specifyMethod')} className="flex-[0.5] text-sm border border-slate-300 rounded-lg px-3 py-2 focus:border-itu-cyan focus:ring-1 focus:ring-itu-cyan outline-none transition-all min-w-[120px]" />
                        )}
                        <div className="flex-1 flex items-center relative">
                          <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3" />
                          <input type="text" value={linkUrl || ''} onChange={(e) => updateLink(mode, e.target.value)} placeholder="https:// example.com/resource" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-itu-cyan focus:ring-1 focus:ring-itu-cyan outline-none transition-all" />
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 sm:ml-auto">
                        {linkUrl && (
                          <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-itu-blue hover:text-white hover:bg-itu-blue border border-itu-blue/20 rounded-lg transition-all shadow-sm flex items-center" title="Test Link">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => toggleDeliveryMode(mode)} className="p-2 text-slate-400 hover:text-white hover:bg-red-500 hover:border-red-500 border border-transparent rounded-lg transition-all" title="Remove mode">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 border-2 border-dashed border-slate-300 bg-slate-50/50 text-itu-blue rounded-lg hover:border-itu-cyan hover:bg-blue-50 hover:text-itu-cyan transition-all text-sm font-bold tracking-wide mt-2">
              <Plus className="w-4 h-4 mr-2" /> {t('step3.selectModes')}
            </button>
          </div>
        </div>
      </div>
      <DeliveryModeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedModes={content.deliveryModes} onToggleMode={toggleDeliveryMode} />
    </>
  );
};

// --- Sub-component: Sub-SubContent Card ---
const SubSubContentCard: React.FC<{
  subSub: LSContent;
  index: number;
  sIdx: number;
  ssIdx: number;
  onUpdate: (data: Partial<LSContent>) => void;
  onRemove: () => void;
  onMove: (ssIdx: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ subSub, index, sIdx, ssIdx, onUpdate, onRemove, onMove, isFirst, isLast }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2 relative transition-all shadow-sm">
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center flex-grow cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown className="w-3 h-3 mr-2 text-slate-400 group-hover:text-itu-blue transition-colors" /> : <ChevronRight className="w-3 h-3 mr-2 text-slate-400 group-hover:text-itu-blue transition-colors" />}
          <span className="flex items-center text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
            <CornerDownRight className="w-3 h-3 mr-1" /> {index + 1}.{sIdx + 1}.{ssIdx + 1}
          </span>
          {!isExpanded && (
            <div className="ml-3 flex items-center text-xs truncate max-w-[350px]">
              <span className="font-semibold text-slate-600 truncate">{subSub.title || t('step3.untitledContent')}</span>
              <span className="mx-2 text-slate-300 shrink-0">•</span>
              <span className="text-slate-500 shrink-0">{subSub.duration ?? '-'} {t('step3.minutes')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {!isFirst && (
            <button onClick={(e) => { e.stopPropagation(); onMove(ssIdx, 'up'); }} className="text-slate-400 hover:text-itu-blue p-1 rounded-full transition-colors"><ArrowUp className="w-3 h-3" /></button>
          )}
          {!isLast && (
            <button onClick={(e) => { e.stopPropagation(); onMove(ssIdx, 'down'); }} className="text-slate-400 hover:text-itu-blue p-1 rounded-full transition-colors"><ArrowDown className="w-3 h-3" /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 animate-fade-in">
          <ContentFields content={subSub} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}

// --- Sub-component: SubContent Card ---
const SubContentCard: React.FC<{
  sub: LSContent;
  index: number;
  sIdx: number;
  onUpdate: (data: Partial<LSContent>) => void;
  onRemove: () => void;
  onMove: (sIdx: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ sub, index, sIdx, onUpdate, onRemove, onMove, isFirst, isLast }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const addSubSubContent = () => {
    const newSubSub: LSContent = {
      id: crypto.randomUUID(),
      title: '',
      deliveryModes: [],
      deliveryLinks: {}
    };
    onUpdate({ subContents: [...(sub.subContents || []), newSubSub] });
  };

  const updateSubSubContent = (ssId: string, data: Partial<LSContent>) => {
    const newSubSubs = (sub.subContents || []).map(ss => ss.id === ssId ? { ...ss, ...data } : ss);
    onUpdate({ subContents: newSubSubs });
  };

  const removeSubSubContent = (ssId: string) => {
    const newSubSubs = (sub.subContents || []).filter(ss => ss.id !== ssId);
    onUpdate({ subContents: newSubSubs });
  };

  const moveSubSubContent = (ssIdx: number, direction: 'up' | 'down') => {
    const newSubSubs = [...(sub.subContents || [])];
    if (direction === 'up' && ssIdx > 0) {
      [newSubSubs[ssIdx - 1], newSubSubs[ssIdx]] = [newSubSubs[ssIdx], newSubSubs[ssIdx - 1]];
    } else if (direction === 'down' && ssIdx < newSubSubs.length - 1) {
      [newSubSubs[ssIdx + 1], newSubSubs[ssIdx]] = [newSubSubs[ssIdx], newSubSubs[ssIdx + 1]];
    }
    onUpdate({ subContents: newSubSubs });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3 relative transition-all shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center flex-grow cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown className="w-4 h-4 mr-2 text-slate-400 group-hover:text-itu-blue transition-colors" /> : <ChevronRight className="w-4 h-4 mr-2 text-slate-400 group-hover:text-itu-blue transition-colors" />}
          <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            <CornerDownRight className="w-4 h-4 mr-1.5" /> {index + 1}.{sIdx + 1}
          </span>
          {!isExpanded && (
            <div className="ml-3 flex items-center text-sm truncate max-w-[400px]">
              <span className="font-semibold text-slate-700 truncate">{sub.title || t('step3.untitledContent')}</span>
              <span className="mx-2 text-slate-300 shrink-0">•</span>
              <span className="text-slate-500 shrink-0">{sub.duration ?? '-'} {t('step3.minutes')}</span>
              {sub.deliveryModes.length > 0 && (
                <>
                  <span className="mx-2 text-slate-300 shrink-0">•</span>
                  <span className="text-itu-cyan text-xs font-semibold shrink-0">{sub.deliveryModes.length} {t('step3.modes')}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {!isFirst && (
            <button onClick={(e) => { e.stopPropagation(); onMove(sIdx, 'up'); }} className="text-slate-400 hover:text-itu-blue p-1.5 hover:bg-slate-100 rounded-full transition-colors"><ArrowUp className="w-4 h-4" /></button>
          )}
          {!isLast && (
            <button onClick={(e) => { e.stopPropagation(); onMove(sIdx, 'down'); }} className="text-slate-400 hover:text-itu-blue p-1.5 hover:bg-slate-100 rounded-full transition-colors"><ArrowDown className="w-4 h-4" /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
          <ContentFields content={sub} onUpdate={onUpdate} />

          <div className="mt-4 pl-4 ml-2 border-l-2 border-slate-100 relative pt-2">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h5 className="text-xs font-bold text-slate-500 flex items-center bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                <ListTree className="w-3 h-3 mr-1" /> {t('step3.subContents') || 'Sub-Contents'}
              </h5>
              <button
                onClick={addSubSubContent}
                className="flex items-center px-2 py-1 bg-white text-itu-cyan border border-itu-cyan/30 rounded hover:bg-blue-50 hover:border-itu-cyan transition-colors text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3 h-3 mr-1" /> {t('step3.addSubContent')}
              </button>
            </div>

            {sub.subContents && sub.subContents.map((subSub, ssIdx) => (
              <SubSubContentCard
                key={subSub.id}
                index={index}
                sIdx={sIdx}
                ssIdx={ssIdx}
                subSub={subSub}
                onUpdate={(data) => updateSubSubContent(subSub.id, data)}
                onRemove={() => removeSubSubContent(subSub.id)}
                onMove={moveSubSubContent}
                isFirst={ssIdx === 0}
                isLast={ssIdx === sub.subContents!.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Sub-component: Content Card ---
const ContentCard: React.FC<{
  content: LSContent;
  onUpdate: (data: Partial<LSContent>) => void;
  onRemove: () => void;
  onMove: (cIdx: number, direction: 'up' | 'down') => void;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ content, onUpdate, onRemove, onMove, index, isFirst, isLast }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const addSubContent = () => {
    const newSub: LSContent = {
      id: crypto.randomUUID(),
      title: '',
      deliveryModes: [],
      deliveryLinks: {}
    };
    onUpdate({ subContents: [...(content.subContents || []), newSub] });
  };

  const updateSubContent = (subId: string, data: Partial<LSContent>) => {
    const newSubs = (content.subContents || []).map(s => s.id === subId ? { ...s, ...data } : s);
    onUpdate({ subContents: newSubs });
  };

  const removeSubContent = (subId: string) => {
    const newSubs = (content.subContents || []).filter(s => s.id !== subId);
    onUpdate({ subContents: newSubs });
  };

  const moveSubContent = (subIdx: number, direction: 'up' | 'down') => {
    const newSubs = [...(content.subContents || [])];
    if (direction === 'up' && subIdx > 0) {
      [newSubs[subIdx - 1], newSubs[subIdx]] = [newSubs[subIdx], newSubs[subIdx - 1]];
    } else if (direction === 'down' && subIdx < newSubs.length - 1) {
      [newSubs[subIdx + 1], newSubs[subIdx]] = [newSubs[subIdx], newSubs[subIdx + 1]];
    }
    onUpdate({ subContents: newSubs });
  };

  return (
    <div className="border border-slate-300 rounded-lg bg-slate-50/50 p-4 mb-4 relative transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-itu-cyan/40">
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center flex-grow cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown className="w-5 h-5 mr-2 text-slate-400 group-hover:text-itu-blue transition-colors" /> : <ChevronRight className="w-5 h-5 mr-2 text-slate-400 group-hover:text-itu-blue transition-colors" />}
          <h4 className="text-sm font-bold text-slate-600 flex items-center tracking-wide bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
            <Box className="w-4 h-4 mr-2 text-itu-blue" /> CONTENT #{index + 1}
          </h4>
          {!isExpanded && (
            <div className="ml-4 flex items-center text-sm truncate max-w-[600px]">
              <span className="font-bold text-slate-800 truncate">{content.title || t('step3.untitledContent')}</span>
              <span className="mx-2 text-slate-300 shrink-0">•</span>
              <span className="text-slate-600 bg-white px-2 py-0.5 rounded text-xs font-bold border border-slate-200 shadow-sm shrink-0">{content.duration ?? '-'} {t('step3.minutes')}</span>

              {content.deliveryModes.length > 0 && (
                <>
                  <span className="mx-2 text-slate-300 shrink-0">•</span>
                  <span className="text-itu-blue text-xs font-bold px-2 py-0.5 bg-blue-50/80 rounded border border-blue-100 shrink-0 shadow-sm">{content.deliveryModes.length} {t('step3.modes')}</span>
                </>
              )}

              {content.subContents && content.subContents.length > 0 && (
                <>
                  <span className="mx-2 text-slate-300 shrink-0">•</span>
                  <span className="text-itu-cyan text-xs font-bold px-2 py-0.5 bg-cyan-50/80 rounded border border-cyan-100 shrink-0 shadow-sm">{content.subContents.length} {t('step3.subContents')}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {!isFirst && (
            <button onClick={(e) => { e.stopPropagation(); onMove(index, 'up'); }} className="text-slate-400 hover:text-itu-blue p-2 hover:bg-white hover:shadow-sm border border-transparent rounded-full transition-all" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
          )}
          {!isLast && (
            <button onClick={(e) => { e.stopPropagation(); onMove(index, 'down'); }} className="text-slate-400 hover:text-itu-blue p-2 hover:bg-white hover:shadow-sm border border-transparent rounded-full transition-all" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-red-500 p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-red-100 rounded-full transition-all" title="Delete Content"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-200 animate-fade-in">
          <ContentFields content={content} onUpdate={onUpdate} />

          {/* Sub-Contents Area */}
          <div className="mt-8 pl-6 border-l-[3px] border-slate-200/80 lg:pl-8 ml-2">
            <div className="mb-4 flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-600 tracking-wide flex items-center"><CornerDownRight className="w-4 h-4 mr-2" /> {t('step3.subContents').toUpperCase()}</span>
              <button onClick={addSubContent} className="text-xs flex items-center px-4 py-2 bg-slate-50 border border-itu-cyan text-itu-cyan hover:bg-itu-cyan hover:text-white rounded-lg transition-all font-bold tracking-wide shadow-sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('step3.addSubContent')}
              </button>
            </div>

            {(content.subContents || []).map((sub, sIdx) => (
              <SubContentCard
                key={sub.id}
                sub={sub}
                index={index}
                sIdx={sIdx}
                onUpdate={(data) => updateSubContent(sub.id, data)}
                onRemove={() => removeSubContent(sub.id)}
                onMove={moveSubContent}
                isFirst={sIdx === 0}
                isLast={sIdx === (content.subContents?.length || 0) - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Module Card ---
const ModuleCard: React.FC<{
  module: LSModule;
  index: number;
  onUpdate: (id: string, data: Partial<LSModule>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  isEven: boolean;
  globalObjectives: LearningObjective[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ module, index, onUpdate, onRemove, onMove, isFirst, isLast, isEven, globalObjectives, isExpanded, onToggleExpand }) => {
  const { t } = useTranslation();

  // --- Content Handlers ---
  const addContent = () => {
    const newContent: LSContent = {
      id: crypto.randomUUID(),
      title: '',
      deliveryModes: [],
      deliveryLinks: {},
      subContents: []
    };
    onUpdate(module.id, { contents: [...module.contents, newContent] });
  };

  const updateContent = (contentId: string, data: Partial<LSContent>) => {
    const updatedContents = module.contents.map(c => c.id === contentId ? { ...c, ...data } : c);
    onUpdate(module.id, { contents: updatedContents });
  };

  const removeContent = (contentId: string) => {
    const updatedContents = module.contents.filter(c => c.id !== contentId);
    onUpdate(module.id, { contents: updatedContents });
  };

  const moveContent = (contentIdx: number, direction: 'up' | 'down') => {
    const newContents = [...module.contents];
    if (direction === 'up' && contentIdx > 0) {
      [newContents[contentIdx - 1], newContents[contentIdx]] = [newContents[contentIdx], newContents[contentIdx - 1]];
    } else if (direction === 'down' && contentIdx < newContents.length - 1) {
      [newContents[contentIdx + 1], newContents[contentIdx]] = [newContents[contentIdx], newContents[contentIdx + 1]];
    }
    onUpdate(module.id, { contents: newContents });
  };

  // --- Objective Handlers ---
  const toggleObjective = (objId: string) => {
    const currentIds = module.associatedObjectiveIds || [];
    const newIds = currentIds.includes(objId)
      ? currentIds.filter(id => id !== objId)
      : [...currentIds, objId];
    onUpdate(module.id, { associatedObjectiveIds: newIds });
  }

  const totalDuration = module.contents.reduce((acc, c) => {
    let subDuration = (c.subContents || []).reduce((sAcc, s) => {
      let ssDuration = (s.subContents || []).reduce((ssAcc, ss) => ssAcc + (ss.duration || 0), 0);
      return sAcc + (s.duration || 0) + ssDuration;
    }, 0);
    return acc + (c.duration || 0) + subDuration;
  }, 0);

  return (
    <div id={`module-${module.id}`} className={`border border-slate-200 rounded-lg mb-6 transition-all shadow-sm hover:shadow-md scroll-mt-20 ${isEven ? 'bg-white' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between cursor-pointer border-b border-slate-200 rounded-t-lg sticky top-[60px] z-40 shadow-sm ${isEven ? 'bg-white' : 'bg-slate-100'}`} onClick={onToggleExpand}>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center justify-center bg-itu-blue/10 w-12 h-12 rounded-lg text-itu-blue">
            <span className="text-xs font-bold">MOD</span>
            <span className="text-lg font-bold leading-none">{index + 1}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{module.title || 'Untitled Module'}</h3>
            <div className="flex items-center text-xs text-slate-500 space-x-3 mt-1">
              <span className="flex items-center"><Box className="w-3 h-3 mr-1" /> {module.contents.length} Content</span>
              <span className="flex items-center text-itu-gold font-medium"><div className="w-1.5 h-1.5 rounded-full bg-itu-gold mr-1" /> {totalDuration} {t('step3.minutes')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isFirst && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(index, 'up'); }}
              className="text-slate-400 hover:text-itu-blue p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Move Up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(index, 'down'); }}
              className="text-slate-400 hover:text-itu-blue p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Move Down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(module.id); }}
            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400 ml-1" /> : <ChevronDown className="w-5 h-5 text-slate-400 ml-1" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {/* Module Meta Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-slate-100 pb-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 tracking-wide mb-1">{t('step3.moduleTitle')}</label>
              <input
                type="text"
                value={module.title}
                onChange={(e) => onUpdate(module.id, { title: e.target.value })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:border-itu-cyan outline-none"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 tracking-wide mb-1">{t('step3.bloomLevel')}</label>
              <select
                value={module.bloomLevel}
                onChange={(e) => onUpdate(module.id, { bloomLevel: e.target.value as BloomLevel })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm"
              >
                {Object.values(BloomLevel).map(level => (
                  <option key={level} value={level}>{t(`bloomLevels.${level}` as any) || level}</option>
                ))}
              </select>
            </div>

            {/* Module Outcome - Single */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 tracking-wide mb-1">{t('step3.learningOutcome')}</label>
              <p className="text-xs text-slate-400 mb-1">{t('step3.outcomeDesc')}</p>
              <textarea
                value={module.learningOutcome || ''}
                onChange={(e) => onUpdate(module.id, { learningOutcome: e.target.value })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:border-itu-cyan outline-none"
                rows={2}
                placeholder={t('step3.outcomePlace')}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 tracking-wide mb-2">{t('step3.relatedObjectives')}</label>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 max-h-40 overflow-y-auto">
                {globalObjectives.length === 0 && <span className="text-xs text-slate-400">{t('step3.noObjectiveDefined')}</span>}
                {globalObjectives.map((obj, i) => (
                  <label key={obj.id} className="flex items-start space-x-2 mb-2 last:mb-0 cursor-pointer hover:bg-slate-100 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={(module.associatedObjectiveIds || []).includes(obj.id)}
                      onChange={() => toggleObjective(obj.id)}
                      className="mt-1 rounded text-itu-blue focus:ring-itu-cyan"
                    />
                    <span className="text-sm text-slate-700">{obj.text || `Objective ${i + 1}`}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 tracking-wide mb-1">{t('step3.assessmentModule')}</label>
              <input
                type="text"
                value={module.assessmentMethods.join(', ')}
                onChange={(e) => onUpdate(module.id, { assessmentMethods: e.target.value.split(', ') })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:border-itu-cyan outline-none"
                placeholder={t('step3.assessmentPlace')}
              />
            </div>
          </div>

          {/* CONTENTS SECTION */}
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-itu-blue tracking-wide">{t('step3.moduleContent')}</h4>
            <button
              onClick={addContent}
              className="flex items-center text-xs bg-itu-blue text-white px-3 py-1.5 rounded hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" /> {t('step3.addContent')}
            </button>
          </div>

          <div className="space-y-3 bg-slate-100/50 p-4 rounded-lg border border-slate-200/60 min-h-[100px]">
            {module.contents.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                {t('step3.noContent')}
              </div>
            )}
            {module.contents.map((content, idx) => (
              <ContentCard
                key={content.id}
                index={idx}
                content={content}
                onUpdate={(data) => updateContent(content.id, data)}
                onRemove={() => removeContent(content.id)}
                onMove={moveContent}
                isFirst={idx === 0}
                isLast={idx === module.contents.length - 1}
              />
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export const Step3Modules: React.FC<{ context: LSContextType }> = ({ context }) => {
  const { t } = useTranslation();
  const { currentLS, addModule, updateModule, removeModule, moveModule } = context;
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Initialize all to collapsed (false) if empty
  React.useEffect(() => {
    if (currentLS.modules.length > 0 && Object.keys(expandedModules).length === 0) {
      const initial: Record<string, boolean> = {};
      currentLS.modules.forEach(m => { initial[m.id] = false; });
      setExpandedModules(initial);
    }
  }, [currentLS.modules]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allExpanded = currentLS.modules.length > 0 && currentLS.modules.every(m => expandedModules[m.id] !== false);

  const toggleAll = () => {
    const nextState = !allExpanded;
    const newState: Record<string, boolean> = {};
    currentLS.modules.forEach(m => { newState[m.id] = nextState; });
    setExpandedModules(newState);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-itu-blue">{t('step3.title')}</h2>
          <p className="text-slate-500 mt-1">{t('step3.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {currentLS.modules.length > 0 && (
            <button
              onClick={toggleAll}
              className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors font-medium shadow-sm"
              title={allExpanded ? t('step3.collapseAll', 'Collapse All') : t('step3.expandAll', 'Expand All')}
            >
              {allExpanded ? <FoldVertical className="w-5 h-5 mr-2" /> : <UnfoldVertical className="w-5 h-5 mr-2" />}
              <span className="hidden sm:inline">{allExpanded ? t('step3.collapseAll', 'Collapse All') : t('step3.expandAll', 'Expand All')}</span>
            </button>
          )}
          <button
            onClick={addModule}
            className="flex items-center px-4 py-2 bg-itu-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">{t('step3.addModule')}</span>
            <span className="sm:hidden">{t('step3.add')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {currentLS.modules.length === 0 && (
          <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('step3.noModules')}</p>
            <button onClick={addModule} className="text-itu-cyan font-bold hover:underline mt-2">{t('step3.createFirst')}</button>
          </div>
        )}

        {currentLS.modules.map((module, index) => (
          <ModuleCard
            key={module.id}
            index={index}
            module={module}
            onUpdate={updateModule}
            onRemove={removeModule}
            onMove={moveModule}
            isFirst={index === 0}
            isLast={index === currentLS.modules.length - 1}
            isEven={index % 2 === 0}
            globalObjectives={currentLS.objectives}
            isExpanded={expandedModules[module.id] === true}
            onToggleExpand={() => toggleModule(module.id)}
          />
        ))}
      </div>

      {currentLS.modules.length > 0 && (
        <button
          onClick={addModule}
          className="mt-8 flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-itu-cyan hover:text-itu-cyan transition-all font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('step3.addModule')}
        </button>
      )}
    </div>
  );
};