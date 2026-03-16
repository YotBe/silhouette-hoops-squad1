export type DifficultyTier = 'rookie' | 'pro' | 'allstar' | 'mvp' | 'legend';
export type PlayerEra = 'modern' | 'classic' | 'og';

export interface Player {
  id: string;
  name: string;
  team: string;
  teamColor: string;
  position: string;
  number: number;
  nickname: string;
  tier: DifficultyTier;
  videoFile: string;
  imageUrl: string;
  college?: string;
  draftYear?: number;
  facts: string[];
  stats?: { ppg: string; rpg: string; apg: string };
  hasVisibleJersey?: boolean;
}

export const TIER_CONFIG: Record<DifficultyTier, { label: string; color: string; xpRequired: number; timerSeconds: number }> = {
  rookie:  { label: 'Rookie',   color: '142 71% 45%', xpRequired: 0,    timerSeconds: 15 },
  pro:     { label: 'Pro',      color: '210 100% 56%', xpRequired: 200,  timerSeconds: 12 },
  allstar: { label: 'All-Star', color: '280 67% 52%', xpRequired: 500,  timerSeconds: 10 },
  mvp:     { label: 'MVP',      color: '45 93% 58%',  xpRequired: 1000, timerSeconds: 8  },
  legend:  { label: 'Legend',   color: '0 72% 51%',   xpRequired: 2000, timerSeconds: 6  },
};

const espn = (espnId: number) =>
  `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnId}.png&w=350&h=254`;

export const PLAYERS: Player[] = [
  // ─── ROOKIE TIER (the most famous, easiest to recognize) ───────────────────
  {
    id: 'curry', name: 'Stephen Curry', team: 'Warriors', teamColor: '220 65% 33%',
    position: 'PG', number: 30, nickname: 'Chef Curry', tier: 'rookie',
    videoFile: '/videos/curry.mov', imageUrl: espn(3975),
    college: 'Davidson', draftYear: 2009,
    facts: ['NBA all-time leader in 3-pointers made', 'Only unanimous MVP in NBA history (2016)', 'Revolutionized the modern NBA with deep shooting'],
    stats: { ppg: '24.8', rpg: '4.7', apg: '6.4' },
  },
  {
    id: 'kyrie', name: 'Kyrie Irving', team: 'Mavericks', teamColor: '210 100% 30%',
    position: 'PG', number: 11, nickname: 'Uncle Drew', tier: 'rookie',
    videoFile: '/videos/kyrie.mov', imageUrl: espn(6442),
    college: 'Duke', draftYear: 2011,
    facts: ['Hit the iconic 2016 Finals Game 7 three-pointer', 'Considered the best ball handler in NBA history', 'Played "Uncle Drew" in a Pepsi campaign turned movie'],
    stats: { ppg: '23.6', rpg: '3.9', apg: '5.7' },
  },
  {
    id: 'durant', name: 'Kevin Durant', team: 'Suns', teamColor: '15 80% 50%',
    position: 'SF', number: 35, nickname: 'The Slim Reaper', tier: 'rookie',
    videoFile: '/videos/durant.mov', imageUrl: espn(3202),
    college: 'Texas', draftYear: 2007,
    facts: ['At 6\'11" he handles and shoots like a guard', '2× NBA Finals MVP with the Warriors', 'Youngest scoring champion in NBA history at age 21'],
    stats: { ppg: '27.3', rpg: '7.0', apg: '4.4' },
  },
  {
    id: 'lebron', name: 'LeBron James', team: 'Lakers', teamColor: '263 52% 33%',
    position: 'SF', number: 23, nickname: 'King James', tier: 'rookie',
    videoFile: '/videos/lebron.mov', imageUrl: espn(1966),
    college: 'St. Vincent-St. Mary HS', draftYear: 2003,
    facts: ['Only player to score 40,000+ career points', 'Won titles with 3 different franchises', 'Drafted #1 overall straight out of high school'],
    stats: { ppg: '27.1', rpg: '7.5', apg: '7.4' },
  },
  {
    id: 'deni', name: 'Deni Avdija', team: 'Spurs', teamColor: '0 0% 20%',
    position: 'SF', number: 8, nickname: 'Deni', tier: 'rookie',
    videoFile: '/videos/deni.mp4', imageUrl: espn(4395725),
    college: 'Maccabi Tel Aviv (Israel)', draftYear: 2020,
    facts: ['First Israeli lottery pick in NBA history', 'Played pro basketball in Israel before age 18', 'Versatile two-way forward with elite court vision'],
    stats: { ppg: '14.1', rpg: '7.2', apg: '3.8' },
  },
  {
    id: 'giannis', name: 'Giannis Antetokounmpo', team: 'Bucks', teamColor: '142 61% 30%',
    position: 'PF', number: 34, nickname: 'The Greek Freak', tier: 'rookie',
    videoFile: '/videos/giannis.mp4', imageUrl: espn(3032977),
    college: 'Filathlitikos (Greece)', draftYear: 2013,
    facts: ['Back-to-back MVP in 2019 and 2020', 'Led the Bucks to their first title in 50 years in 2021', 'Went from selling goods on the streets of Athens to NBA superstardom'],
    stats: { ppg: '23.4', rpg: '9.8', apg: '4.9' },
  },
  {
    id: 'harden', name: 'James Harden', team: 'Clippers', teamColor: '0 72% 51%',
    position: 'SG', number: 1, nickname: 'The Beard', tier: 'rookie',
    videoFile: '/videos/harden.mp4', imageUrl: espn(3992),
    college: 'Arizona State', draftYear: 2009,
    facts: ['Averaged 36.1 PPG in 2018-19, most in decades', 'Pioneer of the step-back three-pointer', 'Won MVP in 2018 with the Houston Rockets'],
    stats: { ppg: '24.1', rpg: '5.6', apg: '7.1' },
  },
  {
    id: 'sga', name: 'Shai Gilgeous-Alexander', team: 'Thunder', teamColor: '210 100% 40%',
    position: 'SG', number: 2, nickname: 'SGA', tier: 'rookie',
    videoFile: '/videos/sga.mp4', imageUrl: espn(4278073),
    college: 'Kentucky', draftYear: 2018,
    facts: ['Won MVP award in 2025', 'Canadian-born guard who became the face of OKC', 'Known for his unique mid-range game and deceleration moves'],
    stats: { ppg: '31.1', rpg: '5.5', apg: '6.2' },
  },

  // ─── PRO TIER (current stars, somewhat harder) ─────────────────────────────
  {
    id: 'luka', name: 'Luka Doncic', team: 'Mavericks', teamColor: '210 100% 30%',
    position: 'PG', number: 77, nickname: 'Luka Magic', tier: 'pro',
    videoFile: '/videos/luka.mp4', imageUrl: espn(3945274),
    college: 'Real Madrid (Slovenia)', draftYear: 2018,
    facts: ['Won EuroLeague MVP at just 18 years old', 'First player in NBA history with 3+ 40-point triple-doubles in a season', 'Drafted 3rd overall but considered a generational talent'],
    stats: { ppg: '28.4', rpg: '9.1', apg: '8.7' },
  },
  {
    id: 'ja', name: 'Ja Morant', team: 'Grizzlies', teamColor: '190 55% 40%',
    position: 'PG', number: 12, nickname: 'Ja', tier: 'pro',
    videoFile: '/videos/ja.mp4', imageUrl: espn(4279888),
    college: 'Murray State', draftYear: 2019,
    facts: ['Known for impossible hang-time dunks', 'Won Rookie of the Year in 2020', 'Murray State star who shocked the college basketball world'],
    stats: { ppg: '24.7', rpg: '5.8', apg: '8.1' },
  },
  {
    id: 'tatum', name: 'Jayson Tatum', team: 'Celtics', teamColor: '150 61% 35%',
    position: 'SF', number: 0, nickname: 'JT', tier: 'pro',
    videoFile: '/videos/tatum.mp4', imageUrl: espn(4065648),
    college: 'Duke', draftYear: 2017,
    facts: ['Led the Celtics to the 2024 NBA Championship', 'Youngest Celtic to score 10,000 career points', 'Known for a smooth mid-range and pull-up game'],
    stats: { ppg: '26.9', rpg: '8.1', apg: '4.9' },
  },
  {
    id: 'zion', name: 'Zion Williamson', team: 'Pelicans', teamColor: '210 100% 30%',
    position: 'PF', number: 1, nickname: 'Zion', tier: 'pro',
    videoFile: '/videos/zion.mp4', imageUrl: espn(4395651),
    college: 'Duke', draftYear: 2019,
    facts: ['280 lbs power forward who runs like a point guard', 'Scored 50+ points in just his 2nd NBA season', 'One of the most anticipated #1 picks in draft history'],
    stats: { ppg: '25.8', rpg: '7.0', apg: '4.6' },
  },
  {
    id: 'edwards', name: 'Anthony Edwards', team: 'Timberwolves', teamColor: '15 60% 35%',
    position: 'SG', number: 5, nickname: 'Ant-Man', tier: 'pro',
    videoFile: '/videos/edwards.mp4', imageUrl: espn(4432174),
    college: 'Georgia', draftYear: 2020,
    facts: ['Went #1 overall in 2020 draft', 'Led USA Basketball to gold at 2024 Paris Olympics', 'Known for thunderous dunks and charismatic personality'],
    stats: { ppg: '25.9', rpg: '5.4', apg: '5.1' },
  },
  {
    id: 'booker', name: 'Devin Booker', team: 'Suns', teamColor: '15 80% 50%',
    position: 'SG', number: 1, nickname: 'Book', tier: 'pro',
    videoFile: '/videos/booker.mp4', imageUrl: espn(3136193),
    college: 'Kentucky', draftYear: 2015,
    facts: ['Scored 70 points in a single game at age 20', 'Led USA Basketball to 2024 Paris Olympic gold', 'Youngest player ever to score 70 in a game'],
    stats: { ppg: '27.1', rpg: '4.5', apg: '6.9' },
  },
  {
    id: 'wemby', name: 'Victor Wembanyama', team: 'Spurs', teamColor: '0 0% 20%',
    position: 'C', number: 1, nickname: 'Wemby', tier: 'pro',
    videoFile: '/videos/wemby.mp4', imageUrl: espn(5104186),
    college: 'LDLC ASVEL (France)', draftYear: 2023,
    facts: ['7\'4" wingspan is nearly 8 feet wide', 'First player since LeBron to be #1 Consensus NBA draft pick', 'Blocks shots with one hand while looking the other way'],
    stats: { ppg: '21.4', rpg: '10.6', apg: '3.9' },
  },

  // ─── ALL-STAR TIER (great players, need more knowledge to ID) ──────────────
  {
    id: 'jokic', name: 'Nikola Jokic', team: 'Nuggets', teamColor: '200 80% 38%',
    position: 'C', number: 15, nickname: 'The Joker', tier: 'allstar',
    videoFile: '/videos/jokic.mp4', imageUrl: espn(3112335),
    college: 'KK Mega Leks (Serbia)', draftYear: 2014,
    facts: ['3× NBA MVP (2021, 2022, 2024)', 'Drafted 41st overall — one of the greatest steals in NBA history', 'First center since Shaq to win back-to-back MVPs'],
    stats: { ppg: '26.4', rpg: '12.4', apg: '9.0' },
  },
  {
    id: 'embiid', name: 'Joel Embiid', team: '76ers', teamColor: '220 80% 45%',
    position: 'C', number: 21, nickname: 'The Process', tier: 'allstar',
    videoFile: '/videos/embiid.mp4', imageUrl: espn(3059318),
    college: 'Kansas', draftYear: 2014,
    facts: ['Won MVP in 2023 with the 76ers', 'Grew up in Cameroon and didn\'t start playing basketball until age 16', 'One of the most dominant offensive big men in NBA history'],
    stats: { ppg: '33.1', rpg: '10.2', apg: '4.2' },
  },
  {
    id: 'lillard', name: 'Damian Lillard', team: 'Bucks', teamColor: '142 61% 30%',
    position: 'PG', number: 0, nickname: 'Dame Time', tier: 'allstar',
    videoFile: '/videos/lillard.mp4', imageUrl: espn(6606),
    college: 'Weber State', draftYear: 2012,
    facts: ['Hit a 37-foot buzzer-beater to eliminate OKC in 2019', 'Loyal to Portland for 11 seasons before requesting a trade', 'Part-time rapper under the name "Dame D.O.L.L.A."'],
    stats: { ppg: '25.3', rpg: '4.2', apg: '7.3' },
  },
  {
    id: 'kawhi', name: 'Kawhi Leonard', team: 'Clippers', teamColor: '0 72% 51%',
    position: 'SF', number: 2, nickname: 'The Claw', tier: 'allstar',
    videoFile: '/videos/kawhi.mp4', imageUrl: espn(6450),
    college: 'San Diego State', draftYear: 2011,
    facts: ['2× NBA Finals MVP (2014, 2019) with two different teams', 'Known for the 2019 bouncing buzzer-beater vs Philadelphia', 'Considered one of the best defenders of his generation'],
    stats: { ppg: '19.8', rpg: '6.5', apg: '3.9' },
  },
  {
    id: 'cp3', name: 'Chris Paul', team: 'Warriors', teamColor: '220 65% 33%',
    position: 'PG', number: 3, nickname: 'CP3', tier: 'allstar',
    videoFile: '/videos/cp3.mp4', imageUrl: espn(2779),
    college: 'Wake Forest', draftYear: 2005,
    facts: ['Known as "The Point God" for his court vision', 'All-time leader in steals in NBA history', 'Went to 9 All-Star games without an NBA championship until 2022'],
    stats: { ppg: '17.3', rpg: '4.5', apg: '9.4' },
  },

  // ─── MVP TIER (historical greats, harder to ID from silhouette) ────────────
  {
    id: 'kobe', name: 'Kobe Bryant', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'SG', number: 24, nickname: 'Black Mamba', tier: 'mvp',
    videoFile: '/videos/kobe.mp4', imageUrl: espn(110),
    college: 'Lower Merion HS (PA)', draftYear: 1996,
    facts: ['5× NBA Champion, all with the Lakers', 'Scored 81 points in a single game — 2nd most in history', 'Entered the NBA straight from high school at age 17'],
    stats: { ppg: '25.0', rpg: '5.2', apg: '4.7' },
  },
  {
    id: 'shaq', name: 'Shaquille O\'Neal', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'C', number: 34, nickname: 'Diesel', tier: 'mvp',
    videoFile: '/videos/shaq.mp4', imageUrl: espn(614),
    college: 'LSU', draftYear: 1992,
    facts: ['4× NBA Champion, 3 with the Lakers in a row', 'His size (7\'1", 325 lbs) made him virtually unstoppable', 'Won the 2000 NBA Finals MVP averaging 38 PPG and 16.7 RPG'],
    stats: { ppg: '23.7', rpg: '10.9', apg: '2.5' },
  },
  {
    id: 'dirk', name: 'Dirk Nowitzki', team: 'Mavericks (Ret.)', teamColor: '210 100% 30%',
    position: 'PF', number: 41, nickname: 'The German Wunderkind', tier: 'mvp',
    videoFile: '/videos/dirk.mp4', imageUrl: espn(1726),
    college: 'DJK Würzburg (Germany)', draftYear: 1998,
    facts: ['Spent all 21 seasons with the Dallas Mavericks', 'Invented the iconic one-legged fadeaway jumper', 'First European-born player to win NBA Finals MVP (2011)'],
    stats: { ppg: '20.7', rpg: '7.5', apg: '2.4' },
  },
  {
    id: 'ai', name: 'Allen Iverson', team: '76ers (Ret.)', teamColor: '220 80% 45%',
    position: 'PG', number: 3, nickname: 'The Answer', tier: 'mvp',
    videoFile: '/videos/ai.mp4', imageUrl: espn(762),
    college: 'Georgetown', draftYear: 1996,
    facts: ['Won MVP as the smallest player in the league at 6\'0"', 'His crossover dribble changed basketball culture forever', 'Scored 50+ points 12 times in his career'],
    stats: { ppg: '26.7', rpg: '3.7', apg: '6.2' },
  },

  // ─── LEGEND TIER (all-time greats, very hard to ID) ───────────────────────
  {
    id: 'mj', name: 'Michael Jordan', team: 'Bulls (Ret.)', teamColor: '0 72% 51%',
    position: 'SG', number: 23, nickname: 'Air Jordan', tier: 'legend',
    videoFile: '/videos/mj.mp4', imageUrl: espn(1439),
    college: 'North Carolina', draftYear: 1984,
    facts: ['6× NBA Champion, 6× Finals MVP — never lost a Finals series', 'First player to win Defensive POY and MVP in the same season', 'His deal with Nike created the Air Jordan brand worth $5B+ today'],
    stats: { ppg: '30.1', rpg: '6.2', apg: '5.3' },
  },
  {
    id: 'magic', name: 'Magic Johnson', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'PG', number: 32, nickname: 'Magic', tier: 'legend',
    videoFile: '/videos/magic.mp4', imageUrl: espn(1428),
    college: 'Michigan State', draftYear: 1979,
    facts: ['6\'9" point guard revolutionized the position', 'Won NBA championship in his rookie year', 'His rivalry with Larry Bird saved the NBA in the 1980s'],
    stats: { ppg: '19.5', rpg: '7.2', apg: '11.2' },
  },
  {
    id: 'bird', name: 'Larry Bird', team: 'Celtics (Ret.)', teamColor: '150 61% 35%',
    position: 'SF', number: 33, nickname: 'The Hick from French Lick', tier: 'legend',
    videoFile: '/videos/bird.mp4', imageUrl: espn(1423),
    college: 'Indiana State', draftYear: 1978,
    facts: ['3× NBA Champion with the Boston Celtics', 'Won 3 consecutive three-point contest titles', 'Considered the greatest trash talker in basketball history'],
    stats: { ppg: '24.3', rpg: '10.0', apg: '6.3' },
  },
  {
    id: 'kareem', name: 'Kareem Abdul-Jabbar', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'C', number: 33, nickname: 'The Cap', tier: 'legend',
    videoFile: '/videos/kareem.mp4', imageUrl: espn(1418),
    college: 'UCLA', draftYear: 1969,
    facts: ['All-time leading scorer in NBA history for 39 years (until LeBron)', 'Invented the unstoppable skyhook shot', '6× NBA Champion, 6× MVP'],
    stats: { ppg: '24.6', rpg: '11.2', apg: '3.6' },
  },
];

export function getPlayersByTier(tier: DifficultyTier): Player[] {
  return PLAYERS.filter(p => p.tier === tier);
}

export function generateChoices(correct: Player, allPlayers: Player[]): Player[] {
  // Prefer same-tier players as wrong choices for better difficulty balance
  const sameTier = allPlayers.filter(p => p.id !== correct.id && p.tier === correct.tier);
  const otherTier = allPlayers.filter(p => p.id !== correct.id && p.tier !== correct.tier);
  const shuffledSame = [...sameTier].sort(() => Math.random() - 0.5);
  const shuffledOther = [...otherTier].sort(() => Math.random() - 0.5);
  const wrongChoices = [...shuffledSame, ...shuffledOther].slice(0, 3);
  // Ensure we always have 3 wrong choices (fall back if not enough players)
  const safeWrong = wrongChoices.length >= 3
    ? wrongChoices
    : [...allPlayers.filter(p => p.id !== correct.id).sort(() => Math.random() - 0.5)].slice(0, 3);
  return [correct, ...safeWrong].sort(() => Math.random() - 0.5);
}

export type PlayerEraConfig = Record<PlayerEra, { label: string; emoji: string }>;

export const ERA_CONFIG: PlayerEraConfig = {
  modern:  { label: 'Modern Stars',    emoji: '⚡' },
  classic: { label: '90s–00s Legends', emoji: '🔥' },
  og:      { label: 'OG Pioneers',     emoji: '👑' },
};

export function getPlayerEra(player: Player): PlayerEra {
  const year = player.draftYear ?? 2020;
  if (year >= 2010) return 'modern';
  if (year >= 1990) return 'classic';
  return 'og';
}

export function getPlayersByEra(era: PlayerEra): Player[] {
  return PLAYERS.filter(p => getPlayerEra(p) === era);
}
