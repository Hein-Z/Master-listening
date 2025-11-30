import React, { useState } from 'react';
import { Question, UILanguage } from '../types';
import { t } from '../services/translations';

interface QuizProps {
  questions: Question[];
  language: UILanguage;
  glassClass?: string;
  textClass?: string;
  borderClass?: string;
  accentClass?: string;
}

export const Quiz: React.FC<QuizProps> = ({ 
    questions, 
    language,
    glassClass,
    textClass,
    borderClass,
    accentClass
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  const handleSelect = (questionId: string, index: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [questionId]: index }));
  };

  const getOptionClass = (q: Question, index: number) => {
    if (!showResults) {
      return answers[q.id] === index
        ? `bg-white/40 border-current shadow-inner font-bold`
        : `bg-transparent hover:bg-white/20 border-transparent opacity-80`;
    }

    if (index === q.correctIndex) {
      return 'bg-emerald-500/30 border-emerald-500 text-emerald-800 dark:text-emerald-100 font-bold';
    }
    
    if (answers[q.id] === index && index !== q.correctIndex) {
      return 'bg-rose-500/30 border-rose-500 text-rose-800 dark:text-rose-100';
    }

    return 'opacity-40';
  };

  const score = questions.reduce((acc, q) => {
    return acc + (answers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className={`text-xl font-bold ${textClass}`}>{t('comprehension_check', language)}</h2>
        <div className="flex gap-2 items-center">
            <button
                onClick={() => setShowTranslations(!showTranslations)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                    showTranslations 
                    ? `bg-white/40 shadow-sm ${borderClass} ${textClass}` 
                    : `bg-transparent opacity-60 hover:opacity-100 ${borderClass} ${textClass}`
                }`}
            >
                {showTranslations ? t('hide_translations', language) : t('show_translations', language)}
            </button>
            {showResults && (
            <span className={`px-3 py-1 rounded-md font-mono text-sm animate-bounce-gentle bg-white/90 text-black shadow-lg`}>
                {t('score_label', language)} {score} / {questions.length}
            </span>
            )}
        </div>
      </div>

      {questions.map((q, qIndex) => (
        <div key={q.id} className={`p-6 rounded-xl shadow-sm border transition-colors ${glassClass} ${borderClass}`}>
          <div className="mb-4">
             <h3 className={`text-lg font-medium flex gap-3 ${textClass}`}>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold text-sm`}>Q{qIndex + 1}</span>
                <span>{q.question}</span>
             </h3>
             {showTranslations && (q.question_en || q.question_mm) && (
                 <div className="pl-11 mt-2 space-y-1 text-sm opacity-80 border-l-2 ml-4 pl-3 border-current">
                     {q.question_en && <p>{q.question_en}</p>}
                     {q.question_mm && <p className="font-myanmar font-bold">{q.question_mm}</p>}
                 </div>
             )}
          </div>
          
          <div className="space-y-2 pl-11">
            {q.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(q.id, idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all group ${getOptionClass(q, idx)} ${textClass}`}
              >
                <div className="flex flex-col gap-1">
                    <span>{option}</span>
                    {showTranslations && (q.options_en || q.options_mm) && (
                        <div className="text-xs opacity-80 mt-1 font-normal">
                             {q.options_en?.[idx] && <span className="block mb-0.5">{q.options_en[idx]}</span>}
                             {q.options_mm?.[idx] && <span className="block font-myanmar">{q.options_mm[idx]}</span>}
                        </div>
                    )}
                </div>
              </button>
            ))}
          </div>
          
          {showResults && (
            <div className={`mt-4 ml-11 p-4 rounded-lg text-sm leading-relaxed border-l-4 animate-fade-in bg-white/10 ${textClass} border-white/50`}>
              <span className="font-bold block mb-1 opacity-90">{t('explanation_label', language)}</span>
              
              {/* Main Explanation - Japanese with Furigana (if available) */}
              {q.explanation_html ? (
                  <p className="mb-2 text-lg" dangerouslySetInnerHTML={{ __html: q.explanation_html }} />
              ) : (
                  <p className="mb-2">{q.explanation}</p>
              )}

              {/* Translations Logic */}
              {showTranslations && (
                  <div className="pt-2 border-t border-white/20 mt-2 space-y-2 opacity-90">
                       {q.explanation_en && <p>{q.explanation_en}</p>}
                       {q.explanation_mm && <p className="font-myanmar font-bold">{q.explanation_mm}</p>}
                  </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end pt-4">
        {!showResults ? (
          <button
            onClick={() => setShowResults(true)}
            disabled={Object.keys(answers).length !== questions.length}
            className={`px-8 py-3 rounded-lg font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 hover:bg-white text-stone-900 shadow-lg`}
          >
            {t('check_answers', language)}
          </button>
        ) : (
           <button
             onClick={() => { setShowResults(false); setAnswers({}); }}
             className={`px-6 py-2 font-medium transition-colors hover:underline ${textClass}`}
           >
             {t('reset_quiz', language)}
           </button>
        )}
      </div>
    </div>
  );
};