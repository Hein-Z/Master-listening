
import React, { useState, useEffect } from 'react';
import { VocabularyItem, UILanguage } from '../types';
import { t } from '../services/translations';
import { playCorrectSound, playWrongSound } from '../services/audioUtils';

type TestMode = 'KanjiToHiragana' | 'HiraganaToKanji' | 'HiraganaToMyanmar' | 'KanjiToMyanmar';

interface VocabularyTestProps {
  items: VocabularyItem[];
  onExit: () => void;
  language: UILanguage;
  glassClass?: string;
  textClass?: string;
  borderClass?: string;
  accentClass?: string;
}

export const VocabularyTest: React.FC<VocabularyTestProps> = ({ 
    items, 
    onExit, 
    language,
    glassClass,
    textClass,
    borderClass,
    accentClass
}) => {
  const [mode, setMode] = useState<TestMode | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Shuffle items for randomization
  const [shuffledItems, setShuffledItems] = useState<VocabularyItem[]>([]);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    if (items.length > 0) {
      setShuffledItems([...items].sort(() => Math.random() - 0.5));
    }
  }, [items]);

  useEffect(() => {
    if (mode && shuffledItems.length > 0 && currentIndex < shuffledItems.length) {
      generateOptions();
    }
  }, [currentIndex, mode, shuffledItems]);

  const generateOptions = () => {
    const currentItem = shuffledItems[currentIndex];
    const correctAns = getAnswer(currentItem, mode!);
    
    // Get distractors
    const distractors = shuffledItems
      .filter(item => item.word !== currentItem.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(item => getAnswer(item, mode!));

    // Combine and shuffle options
    const allOptions = [...distractors, correctAns];
    // Simple shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    setOptions(allOptions);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const getQuestion = (item: VocabularyItem, m: TestMode) => {
    switch (m) {
      case 'KanjiToHiragana': return item.word;
      case 'HiraganaToKanji': return item.reading;
      case 'HiraganaToMyanmar': return item.reading;
      case 'KanjiToMyanmar': return item.word;
    }
  };

  const getAnswer = (item: VocabularyItem, m: TestMode) => {
    switch (m) {
      case 'KanjiToHiragana': return item.reading;
      case 'HiraganaToKanji': return item.word;
      case 'HiraganaToMyanmar': return item.meaning_mm || item.meaning; // Fallback to English if MM missing
      case 'KanjiToMyanmar': return item.meaning_mm || item.meaning;
    }
  };

  const handleOptionClick = (option: string, index: number) => {
    if (selectedOption !== null) return;
    
    const currentItem = shuffledItems[currentIndex];
    const correctAnswer = getAnswer(currentItem, mode!);
    const correct = option === correctAnswer;
    
    setSelectedOption(index);
    setIsCorrect(correct);
    
    if (correct) {
        setScore(s => s + 1);
        playCorrectSound();
    } else {
        playWrongSound();
    }

    setTimeout(() => {
      if (currentIndex < shuffledItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const resetTest = () => {
    setShowResult(false);
    setCurrentIndex(0);
    setScore(0);
    setShuffledItems([...items].sort(() => Math.random() - 0.5));
    // Mode stays same, or user can click Back
  };

  const containerClass = `p-6 rounded-2xl shadow-lg border animate-fade-in backdrop-blur-md ${glassClass} ${borderClass}`;
  const buttonBaseClass = `p-4 rounded-xl border text-left font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-2`;

  if (!mode) {
    return (
      <div className={`${containerClass} max-w-lg mx-auto`}>
        <h2 className={`text-2xl font-bold text-center mb-6 ${textClass}`}>{t('test_select_mode', language)}</h2>
        <div className="grid gap-4">
          <button onClick={() => setMode('KanjiToHiragana')} className={`${buttonBaseClass} hover:bg-white/40 ${textClass} ${borderClass}`}>
            <span className="text-xl">1.</span> {t('mode_kanji_hiragana', language)}
          </button>
          <button onClick={() => setMode('HiraganaToKanji')} className={`${buttonBaseClass} hover:bg-white/40 ${textClass} ${borderClass}`}>
            <span className="text-xl">2.</span> {t('mode_hiragana_kanji', language)}
          </button>
          <button onClick={() => setMode('HiraganaToMyanmar')} className={`${buttonBaseClass} hover:bg-white/40 ${textClass} ${borderClass}`}>
             <span className="text-xl">3.</span> {t('mode_hiragana_mm', language)}
          </button>
          <button onClick={() => setMode('KanjiToMyanmar')} className={`${buttonBaseClass} hover:bg-white/40 ${textClass} ${borderClass}`}>
             <span className="text-xl">4.</span> {t('mode_kanji_mm', language)}
          </button>
        </div>
        <button onClick={onExit} className={`w-full mt-6 py-3 font-bold opacity-70 hover:opacity-100 transition-colors ${textClass}`}>
            {t('test_back', language)}
        </button>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / shuffledItems.length) * 100);
    let message = t('test_result_keep_practicing', language);
    if (percentage >= 100) message = t('test_result_perfect', language);
    else if (percentage >= 80) message = t('test_result_great', language);
    else if (percentage >= 60) message = t('test_result_good', language);

    return (
        <div className={`${containerClass} max-w-md mx-auto text-center`}>
            <div className="text-6xl mb-4 animate-bounce-gentle">{percentage >= 80 ? '🎉' : '📚'}</div>
            <h2 className={`text-3xl font-bold mb-2 ${textClass} ${language === 'mm' ? 'font-myanmar' : ''}`}>{message}</h2>
            <p className={`${textClass} text-lg mb-8 opacity-90`}>
                {t('test_score', language)} <span className={`font-bold text-2xl`}>{score}</span> / {shuffledItems.length}
            </p>
            
            <div className="flex gap-4">
                <button onClick={resetTest} className={`flex-1 py-3 bg-white/80 hover:bg-white text-stone-900 rounded-lg font-bold shadow-md transition-all active:scale-95`}>
                    {t('test_retry', language)}
                </button>
                <button onClick={() => setMode(null)} className={`flex-1 py-3 bg-black/20 hover:bg-black/30 text-white rounded-lg font-bold transition-all`}>
                    {t('test_change_mode', language)}
                </button>
            </div>
            <button onClick={onExit} className={`block w-full mt-4 opacity-60 hover:opacity-100 text-sm ${textClass}`}>
                {t('test_exit', language)}
            </button>
        </div>
    );
  }

  const currentItem = shuffledItems[currentIndex];

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-slide-up">
        <div className={`flex justify-between items-center text-sm font-medium opacity-80 ${textClass}`}>
            <span>{t('test_question', language)} {currentIndex + 1} / {shuffledItems.length}</span>
            <span>{t('test_score', language)}: {score}</span>
        </div>

        <div className={`p-10 rounded-3xl shadow-lg border-b-4 text-center transition-all ${glassClass} ${borderClass}`}>
            <span className={`text-xs uppercase tracking-widest font-bold mb-3 block opacity-60 ${textClass}`}>
                {mode === 'KanjiToHiragana' || mode === 'KanjiToMyanmar' ? 'Translate this Kanji' : 'Translate this Reading'}
            </span>
            <h2 className={`text-5xl font-bold py-4 leading-normal ${textClass}`}>
                {getQuestion(currentItem, mode)}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option, idx) => {
                let btnClass = `bg-white/20 hover:bg-white/40 border-2 border-transparent ${textClass}`;
                
                if (selectedOption !== null) {
                    const isThisOptionCorrect = option === getAnswer(currentItem, mode);
                    const isThisOptionSelected = idx === selectedOption;

                    if (isThisOptionCorrect) {
                        btnClass = "bg-emerald-500/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold scale-105 shadow-md";
                    } else if (isThisOptionSelected && !isCorrect) {
                        btnClass = "bg-rose-500/40 border-rose-500 text-rose-900 dark:text-rose-100 opacity-80";
                    } else {
                        btnClass = "opacity-30 bg-black/5";
                    }
                }

                return (
                    <button
                        key={idx}
                        onClick={() => handleOptionClick(option, idx)}
                        disabled={selectedOption !== null}
                        className={`p-5 rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-sm min-h-[80px] flex items-center justify-center ${btnClass}`}
                    >
                        <span className={mode.includes('Myanmar') ? 'font-myanmar' : ''}>{option}</span>
                    </button>
                );
            })}
        </div>
    </div>
  );
};
