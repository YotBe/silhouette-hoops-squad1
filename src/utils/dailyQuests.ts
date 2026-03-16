export interface DailyQuest {
  id: string;
  type: 'streak' | 'no_hints' | 'daily_challenge' | 'correct_count' | 'mystery_mode';
  title: string;
  description: string;
  icon: string;
  target: number;
  xpReward: number;
}

const QUEST_POOL: DailyQuest[] = [
  { id: 'streak_3', type: 'streak', title: 'On Fire', description: 'Get a 3-answer streak', icon: '🔥', target: 3, xpReward: 75 },
  { id: 'streak_5', type: 'streak', title: 'Heatin Up', description: 'Get a 5-answer streak', icon: '⚡', target: 5, xpReward: 150 },
  { id: 'no_hints_3', type: 'no_hints', title: 'No Peeking', description: 'Answer 3 questions without hints', icon: '🙈', target: 3, xpReward: 100 },
  { id: 'daily_challenge', type: 'daily_challenge', title: 'Daily Grind', description: 'Complete the Daily Challenge', icon: '📅', target: 1, xpReward: 100 },
  { id: 'correct_5', type: 'correct_count', title: 'Bucket Getter', description: 'Get 5 correct answers total', icon: '🏀', target: 5, xpReward: 50 },
  { id: 'correct_10', type: 'correct_count', title: 'Drop 10', description: 'Get 10 correct answers total', icon: '💯', target: 10, xpReward: 120 },
  { id: 'mystery_1', type: 'mystery_mode', title: 'Detective', description: 'Complete a Mystery Mode round', icon: '🔮', target: 1, xpReward: 80 },
];

function getDateSeed(): string {
  return new Date().toISOString().slice(0, 10);
}

function seededRandom(seed: string, index: number): number {
  const str = seed + String(index);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export function getTodayQuests(): DailyQuest[] {
  const seed = getDateSeed();
  const indices = new Set<number>();
  let i = 0;
  while (indices.size < 3) {
    const idx = Math.floor(seededRandom(seed, i++) * QUEST_POOL.length);
    indices.add(idx);
  }
  return [...indices].map(idx => QUEST_POOL[idx]);
}

interface QuestProgress {
  [questId: string]: number;
}

interface QuestStorage {
  date: string;
  progress: QuestProgress;
  completed: string[];
}

function loadQuestStorage(): QuestStorage {
  try {
    const raw = localStorage.getItem('sg_quest_progress');
    if (!raw) throw new Error();
    const data = JSON.parse(raw) as QuestStorage;
    if (data.date !== getDateSeed()) {
      return { date: getDateSeed(), progress: {}, completed: [] };
    }
    return data;
  } catch {
    return { date: getDateSeed(), progress: {}, completed: [] };
  }
}

function saveQuestStorage(data: QuestStorage): void {
  localStorage.setItem('sg_quest_progress', JSON.stringify(data));
}

export function getQuestProgress(): { quests: DailyQuest[]; progress: QuestProgress; completed: string[] } {
  const storage = loadQuestStorage();
  return {
    quests: getTodayQuests(),
    progress: storage.progress,
    completed: storage.completed,
  };
}

export function updateQuestProgress(sessionStats: {
  bestStreak: number;
  noHintCorrect: number;
  dailyCompleted: boolean;
  totalCorrect: number;
  mysteryCompleted: boolean;
}): string[] {
  const storage = loadQuestStorage();
  const quests = getTodayQuests();
  const newlyCompleted: string[] = [];

  for (const quest of quests) {
    if (storage.completed.includes(quest.id)) continue;

    let progress = 0;
    switch (quest.type) {
      case 'streak':
        progress = sessionStats.bestStreak;
        break;
      case 'no_hints':
        progress = sessionStats.noHintCorrect;
        break;
      case 'daily_challenge':
        progress = sessionStats.dailyCompleted ? 1 : 0;
        break;
      case 'correct_count':
        progress = sessionStats.totalCorrect;
        break;
      case 'mystery_mode':
        progress = sessionStats.mysteryCompleted ? 1 : 0;
        break;
    }

    // Accumulate progress across sessions
    const prev = storage.progress[quest.id] || 0;
    storage.progress[quest.id] = Math.max(prev, progress);

    if (storage.progress[quest.id] >= quest.target) {
      storage.completed.push(quest.id);
      newlyCompleted.push(quest.id);
    }
  }

  saveQuestStorage(storage);
  return newlyCompleted;
}
