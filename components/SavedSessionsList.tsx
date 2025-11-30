

import React, { useState, useEffect } from 'react';
import { SavedSession, DifficultyLevel, UILanguage, TopicId } from '../types';
import { t } from '../services/translations';

interface SavedSessionsListProps {
  sessions: SavedSession[];
  onPlay: (session: SavedSession) => void;
  onDelete: (id: string) => void;
  onCreateNew: (level: DifficultyLevel, customPrompt?: string, voiceMap?: {A: string, B: string, C: string, Narrator: string}, numSpeakers?: number) => void;
  onPreviewVoice?: (voiceName: string) => void;
  topicLabel: string;
  topicId: TopicId;
  language: UILanguage;
  textClass?: string;
  glassClass?: string;
  borderClass?: string;
  inputBgClass?: string;
}

// Updated Voice Mapping
const VOICES = [
  { id: 'Kore', label: 'Haruka', gender: 'female', icon: '👩' },   // Haruka
  { id: 'Zephyr', label: 'Miki', gender: 'female', icon: '👧' },   // Miki
  { id: 'Puck', label: 'Kenji', gender: 'male', icon: '👦' },      // Kenji
  { id: 'Fenrir', label: 'Hiroshi', gender: 'male', icon: '👨' },  // Hiroshi
  { id: 'Charon', label: 'Taro', gender: 'male', icon: '👴' },     // Taro
];

export const SavedSessionsList: React.FC<SavedSessionsListProps> = ({ 
  sessions, 
  onPlay, 
  onDelete, 
  onCreateNew,
  onPreviewVoice,
  topicLabel,
  topicId,
  language,
  textClass,
  glassClass,
  borderClass,
  inputBgClass
}) => {
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('N1');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedJobField, setSelectedJobField] = useState('engineer');
  const [numSpeakers, setNumSpeakers] = useState(2);
  
  // Voice State
  const [speakerAVoice, setSpeakerAVoice] = useState('Kore');
  const [speakerBVoice, setSpeakerBVoice] = useState('Fenrir');
  const [speakerCVoice, setSpeakerCVoice] = useState('Fenrir');
  const [narratorVoice, setNarratorVoice] = useState('Fenrir');

  const isLongSpeech = topicId.includes('long_speech');
  const isCustom = topicId === 'custom';

  // Sync Speaker C with Speaker B when Speaker B changes, if 3 speakers selected
  useEffect(() => {
    if (numSpeakers === 3) {
        setSpeakerCVoice(speakerBVoice);
    }
  }, [speakerBVoice, numSpeakers]);

  const getTranslatedTitle = (scenario: any) => {
      if (language === 'mm' && scenario.title_mm) return scenario.title_mm;
      if (language === 'jp' && scenario.title_jp) return scenario.title_jp;
      if (language === 'en' && scenario.title_en) return scenario.title_en;
      return scenario.title;
  };

  const getTranslatedSummary = (scenario: any) => {
      if (language === 'mm' && scenario.summary_mm) return scenario.summary_mm;
      if (language === 'jp' && scenario.summary_jp) return scenario.summary_jp;
      if (language === 'en' && scenario.summary_en) return scenario.summary_en;
      return scenario.summary;
  };

  const handleGenerate = () => {
    let finalPrompt = customPrompt;

    if (topicId === 'custom' && !customPrompt.trim()) {
      alert("Please enter a topic description.");
      return;
    }

    if (topicId === 'company_interview') {
        const fieldLabel = 
           selectedJobField === 'engineer' ? 'Engineer' :
           selectedJobField === 'kaigo' ? 'Kaigo (Caregiving)' :
           selectedJobField === 'it' ? 'IT / Software' :
           selectedJobField === 'me' ? 'Mechanical Engineering' :
           selectedJobField === 'ec' ? 'Electronics & Communication Engineering' :
           selectedJobField === 'ep' ? 'Electrical Power Engineering' :
           selectedJobField === 'design' ? 'Design' : 'Other';
        
        if (selectedJobField === 'other' && !customPrompt.trim()) {
            alert("Please specify the job field.");
            return;
        }

        // Combine field and custom details
        finalPrompt = `Job Field: ${fieldLabel}. ${customPrompt}`;
    }

    const voiceMap = {
        A: speakerAVoice,
        B: speakerBVoice,
        // Even though C is synced to B in UI, we pass it. The backend maps C to B's voice slot anyway.
        C: speakerCVoice, 
        Narrator: narratorVoice
    };

    // Use default speaker count for non-custom topics
    const effectiveNumSpeakers = isCustom ? numSpeakers : (isLongSpeech ? 1 : 2);

    onCreateNew(selectedLevel, finalPrompt, voiceMap, effectiveNumSpeakers);
  };

  // Safe background fallback if prop not provided
  const inputBackground = inputBgClass || "bg-white/30 dark:bg-black/30";
  const optionBgClass = "bg-slate-100 text-stone-900 dark:bg-slate-800 dark:text-slate-100";

  const renderJobFieldSelector = () => (
      <div className="mb-4">
          <label className={`block text-sm font-bold mb-2 ${textClass || 'text-stone-700'}`}>
             {t('interview_field_label', language)}
          </label>
          <select
             value={selectedJobField}
             onChange={(e) => setSelectedJobField(e.target.value)}
             className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors border-transparent ${inputBackground} ${textClass || 'text-stone-800'}`}
          >
             <option className={optionBgClass} value="engineer">{t('field_engineer', language)}</option>
             <option className={optionBgClass} value="kaigo">{t('field_kaigo', language)}</option>
             <option className={optionBgClass} value="it">{t('field_it', language)}</option>
             <option className={optionBgClass} value="me">{t('field_me', language)}</option>
             <option className={optionBgClass} value="ec">{t('field_ec', language)}</option>
             <option className={optionBgClass} value="ep">{t('field_ep', language)}</option>
             <option className={optionBgClass} value="design">{t('field_design', language)}</option>
             <option className={optionBgClass} value="other">{t('field_other', language)}</option>
          </select>
      </div>
  );

  const VoiceSelector = ({ label, value, onChange, disabled }: { label: string, value: string, onChange: (v: string) => void, disabled?: boolean }) => (
      <div className={`flex-1 min-w-[140px] rounded-lg p-2 border transition-all ${inputBackground} border-white/20`}>
          <div className="flex items-center justify-between mb-1">
             <label className={`block text-xs font-bold opacity-80 ${textClass}`}>{label}</label>
             <button
               onClick={() => onPreviewVoice && onPreviewVoice(value)}
               className={`p-1.5 rounded-full hover:bg-white/40 active:scale-95 transition-all text-current`}
               title="Preview Voice"
               disabled={disabled}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
             </button>
          </div>
          <div className="relative">
             <select 
                value={value} 
                onChange={(e) => {
                    const newValue = e.target.value;
                    onChange(newValue);
                    if (onPreviewVoice) onPreviewVoice(newValue);
                }}
                disabled={disabled}
                className={`w-full p-2 pl-2 text-sm rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none shadow-sm font-bold cursor-pointer bg-transparent ${textClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                {VOICES.map(v => (
                    <option key={v.id} value={v.id} className={optionBgClass}>
                        {v.icon} {v.label} {v.gender === 'male' ? '♂' : '♀'}
                    </option>
                ))}
             </select>
             {!disabled && (
                 <div className={`absolute inset-y-0 right-2 flex items-center pointer-events-none opacity-50 ${textClass}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                 </div>
             )}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${textClass || 'text-stone-900'}`}>{t('library_title', language)}: {topicLabel}</h2>
          <p className={`${textClass || 'text-stone-600'} opacity-80`}>{t('library_desc', language)}</p>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border shadow-lg mb-8 transition-colors backdrop-blur-xl ${glassClass} ${borderClass}`}>
        <h3 className={`text-sm font-bold mb-4 uppercase tracking-wide opacity-80 flex items-center gap-2 ${textClass}`}>
            <span className="text-xl">✨</span> {t('generate_new_title', language)}
        </h3>
        
        {topicId === 'company_interview' && renderJobFieldSelector()}

        {(topicId === 'custom' || (topicId === 'company_interview')) && (
           <div className="mb-5">
               <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={topicId === 'company_interview' ? t('interview_custom_placeholder', language) : t('custom_topic_placeholder', language)}
                  rows={3}
                  className={`w-full p-4 border-transparent rounded-xl placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors resize-y min-h-[80px] shadow-inner ${inputBackground} ${textClass || 'text-stone-800'}`}
               />
           </div>
        )}

        {/* Custom Topic Speaker Count */}
        {isCustom && (
            <div className="mb-5">
                <label className={`block text-xs font-bold mb-2 opacity-80 uppercase tracking-wide ${textClass}`}>{t('num_speakers', language)}</label>
                <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                        <button
                            key={n}
                            onClick={() => setNumSpeakers(n)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border ${
                                numSpeakers === n 
                                ? `bg-white/80 shadow-md transform scale-[1.02] ${textClass} border-transparent` 
                                : `${inputBackground} opacity-80 hover:opacity-100 border-transparent ${textClass}`
                            }`}
                        >
                           {n === 1 ? t('speakers_1', language) : n === 2 ? t('speakers_2', language) : t('speakers_3', language)}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Audio Configuration Panel */}
        <div className={`mb-6 p-4 rounded-xl border ${borderClass} ${inputBackground}`}>
             <h4 className={`text-xs font-bold uppercase tracking-wide opacity-70 mb-3 flex items-center gap-1 ${textClass}`}>
                 🎙️ {t('voice_settings', language)}
             </h4>
             <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-4">
                    {isLongSpeech || (isCustom && numSpeakers === 1) ? (
                        <VoiceSelector label={t('voice_narrator', language)} value={narratorVoice} onChange={setNarratorVoice} />
                    ) : (
                        <>
                            <VoiceSelector label={t('voice_speaker_a', language)} value={speakerAVoice} onChange={setSpeakerAVoice} />
                            {(isCustom ? numSpeakers >= 2 : true) && (
                                <VoiceSelector label={t('voice_speaker_b', language)} value={speakerBVoice} onChange={setSpeakerBVoice} />
                            )}
                            {isCustom && numSpeakers >= 3 && (
                                <VoiceSelector 
                                    label={t('voice_speaker_c', language)} 
                                    value={speakerCVoice} 
                                    onChange={setSpeakerCVoice} 
                                    disabled={true} 
                                />
                            )}
                        </>
                    )}
                </div>
                {/* Voice sharing warning */}
                {isCustom && numSpeakers >= 3 && (
                     <p className={`text-xs opacity-70 mt-1 ${textClass} flex items-center gap-1`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {t('voice_sharing_notice', language)}
                     </p>
                )}
             </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-stretch mt-6">
          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as DifficultyLevel)}
            className={`w-full md:w-48 p-4 text-base border-transparent rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors shadow-sm cursor-pointer ${inputBackground} ${textClass}`}
          >
            <option className={optionBgClass} value="N5">JLPT N5</option>
            <option className={optionBgClass} value="N4">JLPT N4</option>
            <option className={optionBgClass} value="N3">JLPT N3</option>
            <option className={optionBgClass} value="N2">JLPT N2</option>
            <option className={optionBgClass} value="N1">JLPT N1</option>
            <option className={optionBgClass} value="BJT">BJT (Business)</option>
            <option className={optionBgClass} value="Natural">Natural Speaking</option>
            <option className={optionBgClass} value="Anime">Anime</option>
          </select>
          
          <button 
            onClick={handleGenerate}
            className={`w-full md:flex-1 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-3 active:scale-95 transform`}
          >
            {/* AI Sparkles Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                <path d="M20 3v4"/>
                <path d="M22 5h-4"/>
                <path d="M4 17v2"/>
                <path d="M5 18H3"/>
            </svg>
            {t('generate_button', language)}
          </button>
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="grid gap-4">
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 opacity-60 ${textClass}`}>{t('downloaded_section', language)}</h3>
            {sessions.map((session, index) => (
            <div 
                key={session.id} 
                className={`p-5 rounded-xl border shadow-sm transition-all flex justify-between items-center group animate-slide-up hover:scale-[1.01] ${glassClass} ${borderClass} hover:border-white/50`}
                style={{ animationDelay: `${index * 50}ms` }}
            >
                <div className="flex-1 cursor-pointer" onClick={() => onPlay(session)}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-white/50 text-stone-800 shadow-sm`}>{session.scenario.difficulty}</span>
                        <span className={`text-xs opacity-60 ${textClass}`}>
                            {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className={`font-bold text-lg transition-colors ${textClass} ${language === 'mm' ? 'font-myanmar' : ''}`}>
                        {getTranslatedTitle(session.scenario)}
                    </h3>
                    <p className={`text-sm line-clamp-1 opacity-70 ${textClass} ${language === 'mm' ? 'font-myanmar' : ''}`}>
                        {getTranslatedSummary(session.scenario)}
                    </p>
                </div>
                
                <div className={`flex items-center gap-2 pl-4 border-l ml-4 ${borderClass}`}>
                    <button
                        onClick={() => onPlay(session)}
                        className="p-3 bg-white/20 text-current rounded-full hover:bg-white hover:text-black transition-all transform hover:scale-110 shadow-sm"
                        title={t('play_button', language)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                        className="p-3 opacity-60 hover:opacity-100 hover:text-red-500 hover:bg-red-100/50 rounded-full transition-all transform hover:scale-110"
                        title="Delete"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className={`text-center py-10 rounded-xl border-2 border-dashed transition-colors ${borderClass} ${glassClass}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 opacity-50 bg-white/20`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={textClass}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <p className={`font-medium opacity-60 ${textClass}`}>{t('no_files', language)}</p>
        </div>
      )}
    </div>
  );
};