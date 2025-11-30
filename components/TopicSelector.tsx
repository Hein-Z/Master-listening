
import React from 'react';
import { TopicId, TopicDef, UILanguage } from '../types';
import { t } from '../services/translations';

interface TopicSelectorProps {
  onSelect: (id: TopicId) => void;
  disabled: boolean;
  language: UILanguage;
  glassClass?: string;
  borderClass?: string;
  textClass?: string;
  counts?: Record<string, number>;
}

interface TopicDefWithIcon extends TopicDef {
    emoji: string;
}

const TOPICS: TopicDefWithIcon[] = [
  // Long Speech
  { 
      id: 'long_speech_news', 
      category: 'Long Speech', 
      label: 'News Monologue', 
      label_jp: 'ニュース (独白)',
      label_mm: 'သတင်း (တစ်ကိုယ်တော်)',
      description: 'Formal news reading practice (Long Speech).',
      description_jp: 'フォーマルなニュースの読み上げ練習（長文）。',
      description_mm: 'သတင်းဖတ်ကြားခြင်း လေ့ကျင့်ခန်း (မိန့်ခွန်းရှည်)။',
      icon: 'bg-sakura-100 text-sakura-600 dark:bg-sakura-900 dark:text-sakura-300', 
      color: 'border-sakura-200 hover:border-sakura-400 dark:border-sakura-800 dark:hover:border-sakura-600',
      emoji: '📰'
  },
  { 
      id: 'long_speech_presentation', 
      category: 'Long Speech', 
      label: 'Presentation',
      label_jp: 'プレゼンテーション',
      label_mm: 'Presentation တင်ပြခြင်း',
      description: 'Business or academic presentation (Long Speech).',
      description_jp: 'ビジネスや学術的なプレゼンテーション（長文）。',
      description_mm: 'လုပ်ငန်းခွင် (သို့) ပညာရပ်ဆိုင်ရာ တင်ပြခြင်း (မိန့်ခွန်းရှည်)။',
      icon: 'bg-sakura-100 text-sakura-600 dark:bg-sakura-900 dark:text-sakura-300', 
      color: 'border-sakura-200 hover:border-sakura-400 dark:border-sakura-800 dark:hover:border-sakura-600',
      emoji: '📊'
  },
  { 
      id: 'long_speech_job_intro', 
      category: 'Long Speech', 
      label: 'Job Intro', 
      label_jp: '会社・仕事説明会',
      label_mm: 'company နှင့် အလုပ်မိတ်ဆက်ပွဲ',
      description: 'Company introductions and job details.',
      description_jp: '会社概要や業務内容の説明。',
      description_mm: 'ကုမ္ပဏီအကြောင်းနှင့် အလုပ်အကိုင် အသေးစိတ်ရှင်းပြခြင်း။',
      icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300', 
      color: 'border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600',
      emoji: '💼'
  },
  { 
      id: 'long_speech_ceremony', 
      category: 'Long Speech', 
      label: 'Formal Speech', 
      label_jp: '式典の挨拶',
      label_mm: 'မိန့်ခွန်း',
      description: 'Formal greetings for ceremonies and events.',
      description_jp: '式典やイベントでの正式な挨拶。',
      description_mm: 'အခမ်းအနားနှင့် ပွဲလမ်းသဘင်များအတွက် မိန့်ခွန်းများ။',
      icon: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', 
      color: 'border-yellow-200 hover:border-yellow-400 dark:border-yellow-800 dark:hover:border-yellow-600',
      emoji: '🎤'
  },
  
  // Dialogue - Standard
  { 
      id: 'custom', 
      category: 'Dialogue', 
      label: 'Custom Topic', 
      label_jp: 'カスタム', 
      label_mm: 'စိတ်ကြိုက်ခေါင်းစဉ်', 
      description: 'Create your own scenario and context.', 
      description_jp: '独自のシナリオと文脈を作成します。', 
      description_mm: 'မိမိနှစ်သက်ရာ အခြေအနေနှင့် အကြောင်းအရာကို ဖန်တီးပါ။', 
      icon: 'bg-gradient-to-r from-violet-200 to-fuchsia-200 text-purple-800 dark:from-violet-900 dark:to-fuchsia-900 dark:text-purple-200', 
      color: 'border-purple-300 hover:border-purple-500 dark:border-purple-700 dark:hover:border-purple-500',
      emoji: '✨'
  },
  { 
      id: 'company_interview', 
      category: 'Dialogue', 
      label: 'Company Interview', 
      label_jp: '就職面接', 
      label_mm: 'အလုပ်အင်တာဗျူး', 
      description: 'Job interview practice for various fields.', 
      description_jp: '様々な分野の就職面接練習。', 
      description_mm: 'ကဏ္ဍပေါင်းစုံအတွက် အလုပ်အင်တာဗျူး လေ့ကျင့်ခန်း။', 
      icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', 
      color: 'border-indigo-200 hover:border-indigo-400 dark:border-indigo-800 dark:hover:border-indigo-600',
      emoji: '🤝'
  },
  { id: 'business', category: 'Dialogue', label: 'Business', label_jp: 'ビジネス', label_mm: 'စီးပွားရေး (ရုံးသုံး)', description: 'Office meetings, negotiations, and formal keigo.', description_jp: '会議、交渉、敬語など。', description_mm: 'ရုံးအစည်းအဝေး၊ ညှိနှိုင်းမှုနှင့် ယဉ်ကျေးသောစကားများ။', icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300', color: 'border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600', emoji: '🏢' },
  { id: 'economy', category: 'Dialogue', label: 'Economy', label_jp: '経済', label_mm: 'စီးပွားရေး', description: 'Inflation, market trends, and finance.', description_jp: 'インフレ、市場動向、金融。', description_mm: 'ငွေကြေးဖောင်းပွမှု၊ ဈေးကွက်နှင့် ဘဏ္ဍာရေး။', icon: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', color: 'border-yellow-200 hover:border-yellow-400 dark:border-yellow-800 dark:hover:border-yellow-600', emoji: '📈' },
  { id: 'politics', category: 'Dialogue', label: 'Politics', label_jp: '政治', label_mm: 'နိုင်ငံရေး', description: 'Discussions on government and policy.', description_jp: '政府や政策に関する議論。', description_mm: 'အစိုးရနှင့် မူဝါဒဆိုင်ရာ ဆွေးနွေးမှုများ။', icon: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', color: 'border-slate-300 hover:border-slate-500 dark:border-slate-600 dark:hover:border-slate-400', emoji: '🏛️' },
  { id: 'social_issues', category: 'Dialogue', label: 'Social Issues', label_jp: '社会問題', label_mm: 'လူမှုရေး', description: 'Inequality, welfare, and society.', description_jp: '不平等、福祉、社会。', description_mm: 'မညီမျှမှု၊ လူမှုဖူလုံရေးနှင့် လူ့အဖွဲ့အစည်း။', icon: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', color: 'border-teal-200 hover:border-teal-400 dark:border-teal-800 dark:hover:border-teal-600', emoji: '⚖️' },
  { id: 'news', category: 'Dialogue', label: 'News Discussion', label_jp: 'ニュース討論', label_mm: 'သတင်းဆွေးနွေးခြင်း', description: 'Two people discussing current events.', description_jp: '時事問題についての議論。', description_mm: 'လက်ရှိဖြစ်ရပ်များကို ဆွေးနွေးခြင်း။', icon: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300', color: 'border-red-200 hover:border-red-400 dark:border-red-800 dark:hover:border-red-600', emoji: '🗞️' },
  { id: 'tech', category: 'Dialogue', label: 'Technology', label_jp: 'テクノロジー', label_mm: 'နည်းပညာ', description: 'AI, robotics, and digital trends.', description_jp: 'AI、ロボット工学、デジタルトレンド。', description_mm: 'AI၊ စက်ရုပ်နှင့် ဒစ်ဂျစ်တယ်ရေစီးကြောင်းများ။', icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300', color: 'border-cyan-200 hover:border-cyan-400 dark:border-cyan-800 dark:hover:border-cyan-600', emoji: '🤖' },
  { id: 'medical', category: 'Dialogue', label: 'Medical', label_jp: '医療', label_mm: 'ဆေးပညာ', description: 'Doctor visits and health symptoms.', description_jp: '診察や健康状態について。', description_mm: 'ဆရာဝန်ပြသခြင်းနှင့် ကျန်းမာရေးလက္ခဏာများ။', icon: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300', color: 'border-rose-200 hover:border-rose-400 dark:border-rose-800 dark:hover:border-rose-600', emoji: '🏥' },
  { id: 'culture', category: 'Dialogue', label: 'Culture', label_jp: '文化', label_mm: 'ယဉ်ကျေးမှု', description: 'Traditions, art, and societal discussions.', description_jp: '伝統、芸術、社会について。', description_mm: 'ရိုးရာ၊ အနုပညာနှင့် လူမှုရေးဆွေးနွေးမှုများ။', icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300', color: 'border-amber-200 hover:border-amber-400 dark:border-amber-800 dark:hover:border-amber-600', emoji: '🎨' },
  { id: 'romance', category: 'Dialogue', label: 'Romance', label_jp: '恋愛', label_mm: 'အချစ်ရေး', description: 'Dating, relationships, and feelings.', description_jp: 'デート、人間関係、感情。', description_mm: 'ချိန်းတွေ့ခြင်း၊ အချစ်ရေးနှင့် ခံစားချက်များ။', icon: 'bg-pink-200 text-pink-700 dark:bg-pink-900 dark:text-pink-200', color: 'border-pink-300 hover:border-pink-500 dark:border-pink-700 dark:hover:border-pink-500', emoji: '💌' },
  { id: 'family', category: 'Dialogue', label: 'Family', label_jp: '家族', label_mm: 'မိသားစုရေး', description: 'Parenting and family dynamics.', description_jp: '子育てと家族のあり方。', description_mm: 'မိဘအုပ်ထိန်းမှုနှင့် မိသားစုအရေး။', icon: 'bg-orange-200 text-orange-700 dark:bg-orange-800 dark:text-orange-200', color: 'border-orange-300 hover:border-orange-500 dark:border-orange-700 dark:hover:border-orange-500', emoji: '👨‍👩‍👧‍👦' },
  { id: 'personal_problems', category: 'Dialogue', label: 'Personal Issues', label_jp: '個人の悩み', label_mm: 'ကိုယ်ရေးကိုယ်တာပြသနာ', description: 'Life advice and counseling.', description_jp: '人生相談とカウンセリング。', description_mm: 'ဘဝအခက်အခဲများကို သူငယ်ချင်း (သို့) ပညာရှင်များနှင့် တိုင်ပင်ခြင်း။', icon: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300', color: 'border-violet-200 hover:border-violet-400 dark:border-violet-800 dark:hover:border-violet-600', emoji: '🧠' },
  { id: 'scolding', category: 'Dialogue', label: 'Getting Scolded', label_jp: '叱られる', label_mm: 'အဆူခံရခြင်း', description: 'Handling reprimands and apologies.', description_jp: '叱責への対応と謝罪。', description_mm: 'ဆူပူခံရခြင်းနှင့် တောင်းပန်ခြင်းကို ဖြေရှင်းပုံ။', icon: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200', color: 'border-red-300 hover:border-red-500 dark:border-red-800 dark:hover:border-red-600', emoji: '💢' },
  { id: 'casual', category: 'Dialogue', label: 'Casual', label_jp: 'カジュアル', label_mm: 'သာမန်စကားပြော', description: 'Friends talking, slang, and rapid speech.', description_jp: '友達同士の会話、スラング、早口。', description_mm: 'သူငယ်ချင်းများ စကားပြောခြင်း၊ ဗန်းစကားနှင့် လျင်မြန်သောစကားများ။', icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300', color: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-800 dark:hover:border-emerald-600', emoji: '☕' },
  { id: 'education', category: 'Dialogue', label: 'Education', label_jp: '教育', label_mm: 'ပညာရေး', description: 'University lectures and academic talk.', description_jp: '大学の講義や学術的な話。', description_mm: 'တက္ကသိုလ်ပို့ချချက်များနှင့် ပညာရပ်ဆိုင်ရာ ဆွေးနွေးမှုများ။', icon: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300', color: 'border-teal-200 hover:border-teal-400 dark:border-teal-800 dark:hover:border-teal-600', emoji: '🎓' },
  { id: 'travel', category: 'Dialogue', label: 'Travel', label_jp: '旅行', label_mm: 'ခရီးသွား', description: 'Navigation, hotels, and tourism.', description_jp: '道案内、ホテル、観光。', description_mm: 'လမ်းညွှန်၊ ဟိုတယ်နှင့် ခရီးသွားလာရေး။', icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300', color: 'border-orange-200 hover:border-orange-400 dark:border-orange-800 dark:hover:border-orange-600', emoji: '✈️' },
  { id: 'debate', category: 'Dialogue', label: 'Debate', label_jp: '討論', label_mm: 'စကားစစ်ထိုးပွဲ', description: 'Opinions, agreeing, and disagreeing logically.', description_jp: '意見、同意、反論の論理的展開。', description_mm: 'ထင်မြင်ချက်များ၊ သဘောတူညီမှုနှင့် သဘောထားကွဲလွဲမှုများ။', icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300', color: 'border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600', emoji: '🗣️' },
  { id: 'environment', category: 'Dialogue', label: 'Nature', label_jp: '自然・環境', label_mm: 'သဘာဝပတ်ဝန်းကျင်', description: 'Climate change and environment.', description_jp: '気候変動や環境問題。', description_mm: 'ရာသီဥတုပြောင်းလဲမှုနှင့် ပတ်ဝန်းကျင်။', icon: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300', color: 'border-green-200 hover:border-green-400 dark:border-green-800 dark:hover:border-green-600', emoji: '🌿' },
  { id: 'legal', category: 'Dialogue', label: 'Legal', label_jp: '法律', label_mm: 'ဥပဒေ', description: 'Contracts, laws, and regulations.', description_jp: '契約、法律、規制。', description_mm: 'စာချုပ်များ၊ ဥပဒေများနှင့် စည်းမျဉ်းများ။', icon: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300', color: 'border-slate-300 hover:border-slate-500 dark:border-slate-600 dark:hover:border-slate-400', emoji: '⚖️' },
  { id: 'keigo', category: 'Dialogue', label: 'Keigo Drill', label_jp: '敬語ドリル', label_mm: 'ယဉ်ကျေးစကား လေ့ကျင့်ခန်း', description: 'Intensive Sonkeigo and Kenjougo practice.', description_jp: '尊敬語と謙譲語の集中練習。', description_mm: 'Sonkeigo နှင့် Kenjougo အထူးလေ့ကျင့်ခန်း။', icon: 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300', color: 'border-stone-300 hover:border-stone-500 dark:border-stone-600 dark:hover:border-stone-400', emoji: '🙇' },
  { id: 'gossip', category: 'Dialogue', label: 'Gossip (အတင်း‌ပြော)', label_jp: '噂話', label_mm: 'အတင်း‌ပြော', description: 'Casual chats, rumors, and social dynamics.', description_jp: '雑談、噂話、人間関係。', description_mm: 'သာမန်စကားဝိုင်း၊ ကောလာဟလနှင့် လူမှုရေး။', icon: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300', color: 'border-pink-200 hover:border-pink-400 dark:border-pink-800 dark:hover:border-pink-600', emoji: '🤫' },
];

export const TopicSelector: React.FC<TopicSelectorProps> = ({ 
  onSelect, 
  disabled, 
  language,
  glassClass,
  borderClass,
  textClass,
  counts
}) => {
  const longSpeechTopics = TOPICS.filter(t => t.category === 'Long Speech');
  const dialogueTopics = TOPICS.filter(t => t.category === 'Dialogue');

  const getLabel = (t: TopicDef) => {
      if (language === 'jp') return t.label_jp;
      if (language === 'mm') return t.label_mm;
      return t.label;
  };

  const getDesc = (t: TopicDef) => {
      if (language === 'jp') return t.description_jp;
      if (language === 'mm') return t.description_mm;
      return t.description;
  };

  const renderCard = (topic: TopicDefWithIcon) => (
    <button
      key={topic.id}
      onClick={() => onSelect(topic.id)}
      disabled={disabled}
      className={`relative flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-300 transform text-left h-full ${topic.color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105 active:scale-95'} ${glassClass || 'bg-white'}`}
    >
      {counts && counts[topic.id] > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-fade-in">
              {counts[topic.id]}
          </div>
      )}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${topic.icon}`}>
        <span className="text-2xl">{topic.emoji}</span>
      </div>
      <h3 className={`text-lg font-bold mb-2 ${textClass || 'text-stone-800'}`}>{getLabel(topic)}</h3>
      <p className={`text-sm leading-relaxed ${textClass || 'text-stone-600'} opacity-80`}>{getDesc(topic)}</p>
    </button>
  );

  const titleWrapperClass = glassClass 
    ? `${glassClass} ${borderClass} px-6 py-2 rounded-full inline-flex items-center gap-3 mb-6 shadow-sm` 
    : "text-xl font-bold mb-4 flex items-center gap-2";

  return (
    <div className="space-y-10 p-2">
      <div>
        <div className={titleWrapperClass}>
           <span className="text-2xl">📢</span> 
           <h3 className={`text-xl font-bold ${textClass || 'text-sakura-600'}`}>{t('long_speech_category', language)}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {longSpeechTopics.map(renderCard)}
        </div>
      </div>

      <div>
        <div className={titleWrapperClass}>
           <span className="text-2xl">💬</span> 
           <h3 className={`text-xl font-bold ${textClass || 'text-indigo-600'}`}>{t('dialogue_category', language)}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dialogueTopics.map(renderCard)}
        </div>
      </div>
    </div>
  );
};
export { TOPICS };
