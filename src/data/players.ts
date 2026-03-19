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
  clues?: [string, string, string]; // hard → medium → easy
}

export const TIER_CONFIG: Record<DifficultyTier, { label: string; color: string; xpRequired: number; timerSeconds: number }> = {
  rookie:  { label: 'Rookie',   color: '142 71% 45%', xpRequired: 0,    timerSeconds: 25 },
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

  {
    id: 'trae', name: 'Trae Young', team: 'Hawks', teamColor: '0 72% 51%',
    position: 'PG', number: 11, nickname: 'Ice Trae', tier: 'rookie',
    videoFile: '/videos/trae.mp4', imageUrl: espn(4277905),
    college: 'Oklahoma', draftYear: 2018,
    facts: ['Led the Hawks to the 2021 Eastern Conference Finals', 'Traded on draft night for Luka Doncic (via OKC)', 'Known for deep-range step-back threes and creative passing'],
    stats: { ppg: '26.2', rpg: '3.7', apg: '10.8' },
  },
  {
    id: 'bridges', name: 'Mikal Bridges', team: 'Knicks', teamColor: '210 80% 35%',
    position: 'SF', number: 1, nickname: 'Mikal', tier: 'rookie',
    videoFile: '/videos/bridges.mp4', imageUrl: espn(4066569),
    college: 'Villanova', draftYear: 2018,
    facts: ['Won two national titles at Villanova', 'Traded to Brooklyn for Kevin Durant in 2023', 'Elite perimeter defender who can score from anywhere'],
    stats: { ppg: '20.7', rpg: '3.9', apg: '3.6' },
  },
  {
    id: 'scottiebarnes', name: 'Scottie Barnes', team: 'Raptors', teamColor: '0 72% 51%',
    position: 'PF', number: 4, nickname: 'Scottie', tier: 'rookie',
    videoFile: '/videos/scottiebarnes.mp4', imageUrl: espn(4432812),
    college: 'Florida State', draftYear: 2021,
    facts: ['Won Rookie of the Year in 2022', '#4 overall pick who became the face of the Raptors', 'Unique combo of playmaking and size at power forward'],
    stats: { ppg: '19.9', rpg: '8.1', apg: '6.1' },
  },
  {
    id: 'bronny', name: 'Bronny James', team: 'Lakers', teamColor: '263 52% 33%',
    position: 'PG', number: 9, nickname: 'Bronny', tier: 'rookie',
    videoFile: '/videos/bronny.mp4', imageUrl: espn(4871131),
    college: 'USC', draftYear: 2024,
    facts: ['First father-son duo to play simultaneously in NBA history', 'Drafted by the Lakers to play alongside LeBron', 'Made history as a 2024 NBA Draft pick'],
    stats: { ppg: '4.5', rpg: '2.3', apg: '2.1' },
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
  // ─── MORE ALL-STAR / PRO TIER ──────────────────────────────────────────────
  {
    id: 'derozan', name: 'DeMar DeRozan', team: 'Bulls', teamColor: '0 72% 51%',
    position: 'SG', number: 11, nickname: 'The Midrange Maestro', tier: 'allstar',
    videoFile: '/videos/derozan.mp4', imageUrl: espn(2398),
    college: 'USC', draftYear: 2009,
    facts: ['One of the purest midrange scorers in modern NBA history', 'Hit game-winning shots in 5 straight games in 2022', '6× All-Star known for his silky floater and elbow jumper'],
    stats: { ppg: '22.1', rpg: '4.4', apg: '5.1' },
    clues: ['This SG once scored 26 straight points for his team', 'He wears #11 for the Bulls and rarely attempts 3-pointers', 'The Midrange Maestro — DeMar DeRozan'],
  },
  {
    id: 'haliburton', name: 'Tyrese Haliburton', team: 'Pacers', teamColor: '200 80% 38%',
    position: 'PG', number: 0, nickname: 'Hali', tier: 'allstar',
    videoFile: '/videos/haliburton.mp4', imageUrl: espn(4395718),
    college: 'Iowa State', draftYear: 2020,
    facts: ['Known for his unique two-handed free-throw shooting style', 'Led NBA in assists per game in 2023-24', 'Shot an incredible buzzer-beater to win the 2024 Eastern Conference Semifinals'],
    stats: { ppg: '21.7', rpg: '4.0', apg: '10.9' },
    clues: ['This PG shoots free throws with two hands', 'He led Indiana to the 2024 Conference Finals', 'Tyrese Haliburton — Pacers PG #0'],
  },
  {
    id: 'mitchell', name: 'Donovan Mitchell', team: 'Cavaliers', teamColor: '0 72% 51%',
    position: 'SG', number: 45, nickname: 'Spida', tier: 'allstar',
    videoFile: '/videos/mitchell.mp4', imageUrl: espn(3908809),
    college: 'Louisville', draftYear: 2017,
    facts: ['Scored 71 points in a single playoff game in 2023', 'Nickname "Spida" comes from his long, spider-like arms', 'Led the Jazz to multiple playoff appearances before moving to Cleveland'],
    stats: { ppg: '26.6', rpg: '4.4', apg: '4.9' },
    clues: ['This SG scored 71 in a 2023 playoff game', 'He wears #45 and plays for the Cavaliers', 'Spida — Donovan Mitchell'],
  },
  {
    id: 'cade', name: 'Cade Cunningham', team: 'Pistons', teamColor: '0 0% 20%',
    position: 'PG', number: 2, nickname: 'Cade', tier: 'pro',
    videoFile: '/videos/cade.mp4', imageUrl: espn(4432816),
    college: 'Oklahoma State', draftYear: 2021,
    facts: ['#1 overall pick in the 2021 NBA Draft', 'At 6\'6", one of the tallest point guards in the league', 'Rebuilding the Detroit Pistons franchise as their cornerstone'],
    stats: { ppg: '22.7', rpg: '4.4', apg: '7.5' },
    clues: ['This 6\'6" PG was the #1 pick in 2021', 'He plays for Detroit and wears #2', 'Cade Cunningham of the Pistons'],
  },
  {
    id: 'banchero', name: 'Paolo Banchero', team: 'Magic', teamColor: '0 0% 20%',
    position: 'PF', number: 5, nickname: 'Paolo', tier: 'pro',
    videoFile: '/videos/banchero.mp4', imageUrl: espn(4710988),
    college: 'Duke', draftYear: 2022,
    facts: ['Won 2022-23 Rookie of the Year award', '#1 overall pick in the 2022 NBA Draft', 'Italian-American forward known for his scoring versatility'],
    stats: { ppg: '22.6', rpg: '6.9', apg: '5.4' },
    clues: ['This PF won Rookie of the Year in 2023', 'He plays #5 for the Orlando Magic', 'Paolo Banchero — Magic PF'],
  },
  {
    id: 'wagner', name: 'Franz Wagner', team: 'Magic', teamColor: '0 0% 20%',
    position: 'SF', number: 21, nickname: 'Franz', tier: 'allstar',
    videoFile: '/videos/wagner.mp4', imageUrl: espn(4431748),
    college: 'Michigan', draftYear: 2021,
    facts: ['German forward who grew up playing alongside his brother Mo Wagner', 'Known for clutch scoring and strong two-way play', 'Emerged as a star in the 2023-24 Orlando resurgence'],
    stats: { ppg: '22.6', rpg: '4.6', apg: '3.8' },
    clues: ['This German SF plays alongside his brother', 'He wears #21 for Orlando', 'Franz Wagner of the Magic'],
  },
  {
    id: 'markkanen', name: 'Lauri Markkanen', team: 'Jazz', teamColor: '200 80% 38%',
    position: 'PF', number: 23, nickname: 'The Finnish Flash', tier: 'allstar',
    videoFile: '/videos/markkanen.mp4', imageUrl: espn(3136160),
    college: 'Arizona', draftYear: 2017,
    facts: ['At 7 feet, shoots 3-pointers at elite guard efficiency', 'Won the 2022-23 Most Improved Player Award', 'First Finnish player to win an individual NBA award'],
    stats: { ppg: '21.7', rpg: '8.4', apg: '1.9' },
    clues: ['This 7-foot PF shoots 3s at elite efficiency', 'He wears #23 for the Utah Jazz', 'Lauri Markkanen — The Finnish Flash'],
  },
  {
    id: 'adebayo', name: 'Bam Adebayo', team: 'Heat', teamColor: '0 72% 51%',
    position: 'C', number: 13, nickname: 'Bam', tier: 'allstar',
    videoFile: '/videos/adebayo.mp4', imageUrl: espn(3135047),
    college: 'Kentucky', draftYear: 2017,
    facts: ['Made the "Block of the Century" against Jayson Tatum in the 2020 Playoffs', 'Named NBA All-Defensive First Team multiple times', 'The anchor of the Miami Heat culture under Erik Spoelstra'],
    stats: { ppg: '19.3', rpg: '10.4', apg: '3.6' },
    clues: ['This C made a legendary block against Tatum in 2020', 'He wears #13 for the Miami Heat', 'Bam Adebayo — Heat center'],
  },
  {
    id: 'draymond', name: 'Draymond Green', team: 'Warriors', teamColor: '220 65% 33%',
    position: 'PF', number: 23, nickname: 'Draymond', tier: 'mvp',
    videoFile: '/videos/draymond.mp4', imageUrl: espn(6589),
    college: 'Michigan State', draftYear: 2012,
    facts: ['Considered the engine of the Warriors\' dynasty — 4 championships', 'Won Defensive Player of the Year in 2017', 'Rarely scores but impacts the game in every other way'],
    stats: { ppg: '8.5', rpg: '6.8', apg: '6.8' },
    clues: ['This PF averages more assists than points', 'He wears #23 and has 4 Warriors championships', 'Draymond Green — defensive mastermind'],
  },
  {
    id: 'butler', name: 'Jimmy Butler', team: 'Warriors', teamColor: '220 65% 33%',
    position: 'SF', number: 4, nickname: 'Buckets', tier: 'mvp',
    videoFile: '/videos/butler.mp4', imageUrl: espn(6430),
    college: 'Marquette', draftYear: 2011,
    facts: ['Went undrafted by multiple teams before becoming a superstar', 'Led Miami to back-to-back NBA Finals appearances', 'Transformed from a journeyman into one of the league\'s best closers'],
    stats: { ppg: '20.0', rpg: '5.3', apg: '5.3' },
    clues: ['This SF went from a 30th pick to multiple Finals appearances', 'He wears #4 and is known as "Buckets"', 'Jimmy Butler — Heat/Warriors forward'],
  },

  // ─── CLASSIC LEGENDS ────────────────────────────────────────────────────────
  {
    id: 'barkley', name: 'Charles Barkley', team: 'Suns (Ret.)', teamColor: '15 80% 50%',
    position: 'PF', number: 34, nickname: 'Sir Charles', tier: 'legend',
    videoFile: '/videos/barkley.mp4', imageUrl: espn(569),
    college: 'Auburn', draftYear: 1984,
    facts: ['Won MVP in 1993 despite never winning a championship', 'Listed at 6\'6" but played and dominated as a center', 'Known for his rebounding, physicality, and outspoken personality'],
    stats: { ppg: '22.1', rpg: '11.7', apg: '3.9' },
    clues: ['This PF won MVP in 1993 without a ring', 'He wore #34 and is now a famous TV analyst', 'Sir Charles Barkley of the Phoenix Suns'],
  },
  {
    id: 'pippen', name: 'Scottie Pippen', team: 'Bulls (Ret.)', teamColor: '0 72% 51%',
    position: 'SF', number: 33, nickname: 'Pip', tier: 'legend',
    videoFile: '/videos/pippen.mp4', imageUrl: espn(547),
    college: 'Central Arkansas', draftYear: 1987,
    facts: ['6-time NBA champion alongside Michael Jordan', 'Considered one of the greatest defensive players ever', 'Was famously underpaid for much of his career with Chicago'],
    stats: { ppg: '16.1', rpg: '6.4', apg: '5.2' },
    clues: ['This SF won 6 titles alongside Michael Jordan', 'He wore #33 for the Chicago Bulls', 'Scottie Pippen — "Pip"'],
  },
  {
    id: 'ewing', name: 'Patrick Ewing', team: 'Knicks (Ret.)', teamColor: '0 0% 20%',
    position: 'C', number: 33, nickname: 'The Captain', tier: 'legend',
    videoFile: '/videos/ewing.mp4', imageUrl: espn(524),
    college: 'Georgetown', draftYear: 1985,
    facts: ['Dominated for the Knicks but never won a championship', 'Named to the 50 Greatest Players in NBA History list', '11× All-Star and one of the most feared big men of the 90s'],
    stats: { ppg: '21.0', rpg: '9.8', apg: '2.0' },
    clues: ['This C anchored the Knicks for 15 seasons', 'He wore #33 and played college ball at Georgetown', 'Patrick Ewing — The Captain'],
  },
  {
    id: 'gpayton', name: 'Gary Payton', team: 'Sonics (Ret.)', teamColor: '0 128% 0%',
    position: 'PG', number: 20, nickname: 'The Glove', tier: 'legend',
    videoFile: '/videos/gpayton.mp4', imageUrl: espn(525),
    college: 'Oregon State', draftYear: 1990,
    facts: ['Only point guard to win NBA Defensive Player of the Year', 'Known as "The Glove" for his elite on-ball defense', 'Legendary trash talker who led the Sonics to the 1996 Finals'],
    stats: { ppg: '16.3', rpg: '4.3', apg: '6.7' },
    clues: ['This PG is the only guard to win Defensive Player of the Year', 'He wore #20 for the Seattle SuperSonics', 'Gary Payton — The Glove'],
  },
  {
    id: 'stockton', name: 'John Stockton', team: 'Jazz (Ret.)', teamColor: '200 80% 38%',
    position: 'PG', number: 12, nickname: 'Stockton', tier: 'legend',
    videoFile: '/videos/stockton.mp4', imageUrl: espn(548),
    college: 'Gonzaga', draftYear: 1984,
    facts: ['All-time NBA leader in assists AND steals', 'Formed the most famous pick-and-roll duo with Karl Malone', 'Played his entire 19-year career with the Utah Jazz'],
    stats: { ppg: '13.1', rpg: '2.7', apg: '10.5' },
    clues: ['This PG leads the NBA all-time in assists and steals', 'He played 19 seasons for Utah wearing #12', 'John Stockton of the Jazz'],
  },
  {
    id: 'miller', name: 'Reggie Miller', team: 'Pacers (Ret.)', teamColor: '200 80% 38%',
    position: 'SG', number: 31, nickname: 'Knick Killer', tier: 'legend',
    videoFile: '/videos/miller.mp4', imageUrl: espn(541),
    college: 'UCLA', draftYear: 1987,
    facts: ['Scored 8 points in 8.9 seconds against the Knicks in 1995', 'One of the greatest three-point shooters of his era', 'Played his entire career with Indiana, never winning a title'],
    stats: { ppg: '18.2', rpg: '3.0', apg: '3.0' },
    clues: ['This SG scored 8 points in under 9 seconds vs. the Knicks', 'He wore #31 for Indiana his whole career', 'Reggie Miller — The Knick Killer'],
  },
  {
    id: 'drexler', name: 'Clyde Drexler', team: 'Blazers (Ret.)', teamColor: '0 72% 51%',
    position: 'SG', number: 22, nickname: 'Clyde the Glide', tier: 'legend',
    videoFile: '/videos/drexler.mp4', imageUrl: espn(521),
    college: 'Houston', draftYear: 1983,
    facts: ['One of only three players to average 20+ PPG, 6+ RPG, and 5+ APG in their career', 'Won the 1995 NBA Championship with the Houston Rockets', 'His effortless gliding style earned him the nickname "The Glide"'],
    stats: { ppg: '20.4', rpg: '6.1', apg: '5.6' },
    clues: ['This SG had 20/6/5 career averages across 15 seasons', 'He wore #22 and was nicknamed "The Glide"', 'Clyde Drexler of the Portland Trail Blazers'],
  },
  {
    id: 'dominique', name: 'Dominique Wilkins', team: 'Hawks (Ret.)', teamColor: '0 72% 51%',
    position: 'SF', number: 21, nickname: 'The Human Highlight Film', tier: 'legend',
    videoFile: '/videos/dominique.mp4', imageUrl: espn(523),
    college: 'Georgia', draftYear: 1982,
    facts: ['9× All-Star with the Atlanta Hawks', 'Had legendary Slam Dunk Contest battles with Michael Jordan', 'His explosive dunking style earned him the nickname "The Human Highlight Film"'],
    stats: { ppg: '24.8', rpg: '6.7', apg: '2.5' },
    clues: ['This SF battled Jordan in legendary dunk contests', 'He wore #21 and starred for the Atlanta Hawks', 'Dominique Wilkins — The Human Highlight Film'],
  },

  // ─── PRO TIER ADDITIONS ─────────────────────────────────────────────────────
  {
    id: 'jaylen', name: 'Jaylen Brown', team: 'Celtics', teamColor: '150 61% 35%',
    position: 'SG', number: 7, nickname: 'JB', tier: 'rookie',
    videoFile: '/videos/jaylen.mp4', imageUrl: espn(3917376),
    college: 'California', draftYear: 2016,
    facts: ['Won the 2024 NBA championship and Finals MVP', 'First player to win Finals MVP on a max contract', 'Known for combining athleticism with a polished offensive game'],
    stats: { ppg: '23.0', rpg: '5.5', apg: '3.5' },
    clues: ['This SG won Finals MVP in 2024 for Boston', 'He wears #7 and is nicknamed "JB"', 'Jaylen Brown of the Celtics'],
  },
  {
    id: 'lamelo', name: 'LaMelo Ball', team: 'Hornets', teamColor: '190 55% 40%',
    position: 'PG', number: 1, nickname: 'Melo', tier: 'pro',
    videoFile: '/videos/lamelo.mp4', imageUrl: espn(4432575),
    college: 'Illawarra Hawks (Australia)', draftYear: 2020,
    facts: ['Youngest player in NBA history to record a triple-double', 'Won Rookie of the Year in 2021', 'Grew up on YouTube and social media before entering the NBA'],
    stats: { ppg: '23.9', rpg: '5.8', apg: '8.0' },
    clues: ['This PG is the youngest ever to record an NBA triple-double', 'He wears #1 for Charlotte and went pro in Australia', 'LaMelo Ball — Hornets PG'],
  },
  {
    id: 'brunson', name: 'Jalen Brunson', team: 'Knicks', teamColor: '210 80% 35%',
    position: 'PG', number: 11, nickname: 'JB', tier: 'pro',
    videoFile: '/videos/brunson.mp4', imageUrl: espn(3934672),
    college: 'Villanova', draftYear: 2018,
    facts: ['Led Villanova to two national championships', 'Transformed the Knicks into a playoff contender as the franchise star', 'Known for his elite Euro step and crafty finishing'],
    stats: { ppg: '28.7', rpg: '3.6', apg: '6.7' },
    clues: ['This PG won 2 college titles at Villanova', 'He wears #11 for the New York Knicks', 'Jalen Brunson — Knicks PG'],
  },
  {
    id: 'murray', name: 'Jamal Murray', team: 'Nuggets', teamColor: '200 80% 38%',
    position: 'PG', number: 27, nickname: 'Blue Arrow', tier: 'pro',
    videoFile: '/videos/murray.mp4', imageUrl: espn(3936299),
    college: 'Kentucky', draftYear: 2016,
    facts: ['Scored 50 points in a playoff game during the 2020 bubble', 'Key partner alongside Jokic in the 2023 NBA Championship run', 'Canadian guard nicknamed "Blue Arrow" for his shooting'],
    stats: { ppg: '21.2', rpg: '4.0', apg: '6.5' },
    clues: ['This Canadian PG scored 50 in a playoff game in the bubble', 'He wears #27 for Denver and won the 2023 championship', 'Jamal Murray — Blue Arrow'],
  },
  {
    id: 'maxey', name: 'Tyrese Maxey', team: '76ers', teamColor: '220 80% 45%',
    position: 'PG', number: 0, nickname: 'Maxey', tier: 'pro',
    videoFile: '/videos/maxey.mp4', imageUrl: espn(4431706),
    college: 'Kentucky', draftYear: 2020,
    facts: ['Won Most Improved Player in 2023-24', 'Became the 76ers cornerstone after Ben Simmons trade', 'Known for his explosive speed and pull-up shooting'],
    stats: { ppg: '25.9', rpg: '3.7', apg: '6.5' },
    clues: ['This PG won Most Improved Player in 2024', 'He wears #0 for Philadelphia', 'Tyrese Maxey of the 76ers'],
  },

  // ─── ALL-STAR TIER ADDITIONS ─────────────────────────────────────────────────
  {
    id: 'pg', name: 'Paul George', team: '76ers', teamColor: '220 80% 45%',
    position: 'SF', number: 8, nickname: 'PG-13', tier: 'allstar',
    videoFile: '/videos/pg.mp4', imageUrl: espn(4251),
    college: 'Fresno State', draftYear: 2010,
    facts: ['Made 9 All-Star teams across his career', 'Known for his elite two-way ability at small forward', 'Returned from a horrific leg injury to become even better'],
    stats: { ppg: '20.4', rpg: '6.6', apg: '3.9' },
    clues: ['This SF made 9 All-Star teams and plays both ends', 'He wears #8 and is nicknamed "PG-13"', 'Paul George — PG-13'],
  },
  {
    id: 'klay', name: 'Klay Thompson', team: 'Mavericks', teamColor: '210 100% 30%',
    position: 'SG', number: 31, nickname: 'Splash Brother', tier: 'rookie',
    videoFile: '/videos/klay.mp4', imageUrl: espn(6475),
    college: 'Washington State', draftYear: 2011,
    facts: ['Hit 14 three-pointers in a single game', 'Scored 37 points in one quarter — an NBA record', '4× NBA Champion and co-inventor of the "Splash Brothers" era'],
    stats: { ppg: '19.5', rpg: '3.5', apg: '2.3' },
    clues: ['This SG scored 37 points in a single quarter', 'He was a Splash Brother alongside Curry', 'Klay Thompson'],
  },
  {
    id: 'kat', name: 'Karl-Anthony Towns', team: 'Knicks', teamColor: '210 80% 35%',
    position: 'C', number: 32, nickname: 'KAT', tier: 'allstar',
    videoFile: '/videos/kat.mp4', imageUrl: espn(3136779),
    college: 'Kentucky', draftYear: 2015,
    facts: ['Shoots 40%+ from three as a 7-foot center', 'Won Rookie of the Year in 2016', 'Dominican-American who has been open about personal losses'],
    stats: { ppg: '22.7', rpg: '11.0', apg: '3.0' },
    clues: ['This 7-foot C shoots three-pointers at 40%', 'He wears #32 for the Knicks and is nicknamed KAT', 'Karl-Anthony Towns'],
  },
  {
    id: 'lavine', name: "Zach LaVine", team: 'Bulls', teamColor: '0 72% 51%',
    position: 'SG', number: 8, nickname: 'LaVine', tier: 'allstar',
    videoFile: '/videos/lavine.mp4', imageUrl: espn(3064514),
    college: 'UCLA', draftYear: 2014,
    facts: ['Back-to-back Slam Dunk Contest champion (2015, 2016)', 'Averaged 24+ PPG for three straight seasons with Chicago', 'One of the most explosive athletes in the NBA'],
    stats: { ppg: '24.4', rpg: '4.6', apg: '4.5' },
    clues: ['This SG won back-to-back dunk contests in 2015-16', 'He wears #8 for the Chicago Bulls', 'Zach LaVine'],
  },
  {
    id: 'fox', name: "De'Aaron Fox", team: 'Spurs', teamColor: '0 0% 20%',
    position: 'PG', number: 5, nickname: 'Swipa', tier: 'allstar',
    videoFile: '/videos/fox.mp4', imageUrl: espn(4066259),
    college: 'Kentucky', draftYear: 2017,
    facts: ['One of the fastest players in the NBA', "Nicknamed 'Swipa' for his quick hands and steals", 'Led the Kings to the playoffs for the first time in 16 years in 2023'],
    stats: { ppg: '26.6', rpg: '4.5', apg: '6.0' },
    clues: ['This PG is one of the fastest players in the league', 'He wore #5 for Sacramento and is nicknamed Swipa', "De'Aaron Fox"],
  },

  // ─── MVP TIER ADDITIONS ──────────────────────────────────────────────────────
  {
    id: 'timDuncan', name: 'Tim Duncan', team: 'Spurs (Ret.)', teamColor: '0 0% 20%',
    position: 'PF', number: 21, nickname: 'The Big Fundamental', tier: 'mvp',
    videoFile: '/videos/timDuncan.mp4', imageUrl: espn(1495),
    college: 'Wake Forest', draftYear: 1997,
    facts: ['5× NBA Champion, all with the San Antonio Spurs', 'Considered the greatest power forward of all time', 'Won 3 Finals MVPs and 2 regular-season MVPs'],
    stats: { ppg: '19.0', rpg: '10.8', apg: '3.0' },
    clues: ['This PF won 5 titles all with one team', 'He wore #21 and is called "The Big Fundamental"', 'Tim Duncan of the Spurs'],
  },
  {
    id: 'kg', name: 'Kevin Garnett', team: 'Celtics (Ret.)', teamColor: '150 61% 35%',
    position: 'PF', number: 5, nickname: 'The Big Ticket', tier: 'mvp',
    videoFile: '/videos/kg.mp4', imageUrl: espn(708),
    college: 'Mauldin HS — went straight to NBA', draftYear: 1995,
    facts: ['2003-04 MVP and 2008 NBA Champion with Boston', 'Known for his intense passion and championship DNA', 'One of the most versatile big men in league history'],
    stats: { ppg: '17.8', rpg: '10.0', apg: '3.7' },
    clues: ['This PF went straight from high school and won MVP in 2004', 'He wore #5 and was nicknamed "The Big Ticket"', 'Kevin Garnett'],
  },
  {
    id: 'westbrook', name: 'Russell Westbrook', team: 'Nuggets', teamColor: '200 80% 38%',
    position: 'PG', number: 0, nickname: 'Brodie', tier: 'mvp',
    videoFile: '/videos/westbrook.mp4', imageUrl: espn(3468),
    college: 'UCLA', draftYear: 2008,
    facts: ['Averaged a triple-double for 4 straight seasons', 'All-time leader in triple-doubles', 'Won MVP in 2017 and averaged 31.6 PPG that season'],
    stats: { ppg: '23.2', rpg: '7.5', apg: '8.2' },
    clues: ['This PG averaged triple-doubles for 4 straight seasons', 'He is the all-time leader in triple-doubles', 'Russell Westbrook — Brodie'],
  },

  // ─── LEGEND TIER ADDITIONS ───────────────────────────────────────────────────
  {
    id: 'drj', name: 'Julius Erving', team: '76ers (Ret.)', teamColor: '220 80% 45%',
    position: 'SF', number: 6, nickname: 'Dr. J', tier: 'legend',
    videoFile: '/videos/drj.mp4', imageUrl: espn(340),
    college: 'Massachusetts', draftYear: 1972,
    facts: ['Pioneered the above-the-rim style of play', 'One of the first true showmen of basketball', 'ABA legend who brought flair and artistry to the NBA'],
    stats: { ppg: '24.2', rpg: '8.5', apg: '4.2' },
    clues: ['This SF pioneered above-the-rim basketball in the 70s', 'He wore #6 and is nicknamed "Dr. J"', 'Julius Erving of the 76ers'],
  },
  {
    id: 'oscar', name: 'Oscar Robertson', team: 'Bucks (Ret.)', teamColor: '142 61% 30%',
    position: 'PG', number: 1, nickname: 'The Big O', tier: 'legend',
    videoFile: '/videos/oscar.mp4', imageUrl: espn(3912),
    college: 'Cincinnati', draftYear: 1960,
    facts: ['Averaged a triple-double for an entire season in 1961-62', 'Won the 1971 NBA championship with Kareem Abdul-Jabbar', 'Considered the template for the modern point guard'],
    stats: { ppg: '25.7', rpg: '7.5', apg: '9.5' },
    clues: ['This PG averaged a triple-double for an entire season', 'He wore #1 and is known as "The Big O"', 'Oscar Robertson — the original triple-double machine'],
  },
  {
    id: 'rodman', name: 'Dennis Rodman', team: 'Bulls (Ret.)', teamColor: '0 72% 51%',
    position: 'PF', number: 91, nickname: 'The Worm', tier: 'legend',
    videoFile: '/videos/rodman.mp4', imageUrl: espn(553),
    college: 'Southeastern Oklahoma State', draftYear: 1986,
    facts: ['Led the NBA in rebounding for 7 straight seasons', 'Won 5 NBA Championships (2 with Detroit, 3 with Chicago)', 'As famous for his wild off-court personality as his elite defense'],
    stats: { ppg: '7.3', rpg: '13.1', apg: '1.8' },
    clues: ['This PF led the NBA in rebounds for 7 straight seasons', 'He wore #91, dyed his hair, and is nicknamed "The Worm"', 'Dennis Rodman'],
  },

  // ─── INTERNATIONAL LEGENDS ──────────────────────────────────────────────────
  {
    id: 'manu', name: 'Manu Ginobili', team: 'Spurs (Ret.)', teamColor: '0 0% 20%',
    position: 'SG', number: 20, nickname: 'El Contusion', tier: 'mvp',
    videoFile: '/videos/manu.mp4', imageUrl: espn(1004),
    college: 'Club Andino (Argentina)', draftYear: 1999,
    facts: ['4× NBA Champion with the San Antonio Spurs', 'Won Olympic Gold for Argentina at the 2004 Athens Olympics', 'Invented and popularized the Euro Step in the NBA'],
    stats: { ppg: '13.3', rpg: '3.5', apg: '3.8' },
    clues: ['This Argentine SG helped popularize the Euro Step', 'He wore #20 and won 4 titles with San Antonio', 'Manu Ginobili — Spurs legend'],
  },
  {
    id: 'tparker', name: 'Tony Parker', team: 'Spurs (Ret.)', teamColor: '0 0% 20%',
    position: 'PG', number: 9, nickname: 'TP', tier: 'mvp',
    videoFile: '/videos/tparker.mp4', imageUrl: espn(2393),
    college: 'INSEP (France)', draftYear: 2001,
    facts: ['4× NBA Champion and 2007 NBA Finals MVP', 'Won the 2007 Finals MVP over Tim Duncan and LeBron', 'French-born point guard drafted out of high school in Europe'],
    stats: { ppg: '15.5', rpg: '2.7', apg: '5.6' },
    clues: ['This French PG won Finals MVP in 2007', 'He wore #9 and spent most of his career in San Antonio', 'Tony Parker — TP'],
  },
  {
    id: 'nash', name: 'Steve Nash', team: 'Suns (Ret.)', teamColor: '15 80% 50%',
    position: 'PG', number: 13, nickname: 'Nash', tier: 'mvp',
    videoFile: '/videos/nash.mp4', imageUrl: espn(1243),
    college: 'Santa Clara', draftYear: 1996,
    facts: ['Won back-to-back MVP awards in 2005 and 2006', 'Led the "Seven Seconds or Less" Suns offensive revolution', 'Canadian-born point guard who never won a championship'],
    stats: { ppg: '14.3', rpg: '3.0', apg: '8.5' },
    clues: ['This Canadian PG won back-to-back MVPs in 2005-06', 'He wore #13 for the Phoenix Suns and never won a ring', 'Steve Nash — Suns legend'],
  },
  {
    id: 'hakeem', name: 'Hakeem Olajuwon', team: 'Rockets (Ret.)', teamColor: '0 72% 51%',
    position: 'C', number: 34, nickname: 'The Dream', tier: 'legend',
    videoFile: '/videos/hakeem.mp4', imageUrl: espn(245),
    college: 'Houston', draftYear: 1984,
    facts: ['The only player to win MVP, Finals MVP, and Defensive POY in the same season (1994)', 'His Dream Shake move is considered the most unguardable post move ever', 'Born in Lagos, Nigeria, and came to the US on a basketball scholarship'],
    stats: { ppg: '21.8', rpg: '11.1', apg: '2.5' },
    clues: ['This Nigerian-born C invented the "Dream Shake" move', 'He wore #34 and won back-to-back titles in 1994-95', 'Hakeem Olajuwon — The Dream'],
  },
  {
    id: 'peja', name: 'Peja Stojakovic', team: 'Kings (Ret.)', teamColor: '0 72% 51%',
    position: 'SF', number: 16, nickname: 'Peja', tier: 'mvp',
    videoFile: '/videos/peja.mp4', imageUrl: espn(1734),
    college: 'PAOK (Serbia)', draftYear: 1996,
    facts: ['3× NBA Three-Point Contest champion', 'Key member of Sacramento Kings teams that nearly toppled the Lakers dynasty', 'Serbian forward known as one of the purest shooters of his era'],
    stats: { ppg: '14.6', rpg: '4.2', apg: '1.5' },
    clues: ['This Serbian SF won 3 Three-Point Contests', 'He wore #16 for the Sacramento Kings', 'Peja Stojakovic — sharpshooter'],
  },

  // ─── NEW ADDITIONS ───────────────────────────────────────────────────────────
  {
    id: 'jjj', name: 'Jaren Jackson Jr.', team: 'Grizzlies', teamColor: '210 50% 35%',
    position: 'PF', number: 13, nickname: 'JJJ', tier: 'pro',
    videoFile: '', imageUrl: espn(4065697),
    college: 'Michigan State', draftYear: 2018,
    facts: ['Won NBA Defensive Player of the Year in 2023', 'Leads the NBA in blocks per game multiple seasons', 'Son of former NBA player Jaren Jackson Sr.'],
    stats: { ppg: '22.0', rpg: '5.6', apg: '1.9' },
    clues: ['This PF led the NBA in blocks and won DPOY in 2023', 'He wears #13 for the Memphis Grizzlies', 'Jaren Jackson Jr. — defensive anchor'],
  },
  {
    id: 'ingram', name: 'Brandon Ingram', team: 'Pelicans', teamColor: '210 100% 30%',
    position: 'SF', number: 14, nickname: 'BI', tier: 'pro',
    videoFile: '', imageUrl: espn(4066259),
    college: 'Duke', draftYear: 2016,
    facts: ['Won Most Improved Player in 2020 as a Pelican', 'Part of the trade that brought Anthony Davis to the Lakers', 'Known for his long, effortless scoring ability at 6\'7"'],
    stats: { ppg: '23.8', rpg: '5.7', apg: '5.1' },
    clues: ['This SF was traded from LA for Anthony Davis', 'He wears #14 for New Orleans and won MIP in 2020', 'Brandon Ingram — BI'],
  },
  {
    id: 'garland', name: 'Darius Garland', team: 'Cavaliers', teamColor: '0 72% 51%',
    position: 'PG', number: 10, nickname: 'DG', tier: 'allstar',
    videoFile: '', imageUrl: espn(4395651),
    college: 'Vanderbilt', draftYear: 2019,
    facts: ['Made the All-Star team in just his third season', 'One of the most creative playmakers of his generation', 'Averaged over 8 assists per game for the Cavaliers in 2022-23'],
    stats: { ppg: '21.7', rpg: '2.9', apg: '8.6' },
    clues: ['This PG averaged 8+ assists for Cleveland in 2022-23', 'He wears #10 and was a Vanderbilt Commodore', 'Darius Garland of the Cavaliers'],
  },
  {
    id: 'cjmc', name: 'CJ McCollum', team: 'Pelicans', teamColor: '210 100% 30%',
    position: 'SG', number: 3, nickname: 'CJ', tier: 'allstar',
    videoFile: '', imageUrl: espn(2991055),
    college: 'Lehigh', draftYear: 2013,
    facts: ['Graduated from Lehigh — a rare mid-major star turned NBA starter', 'Won Most Improved Player in 2015-16', 'Grew up in Akron, Ohio just like LeBron James'],
    stats: { ppg: '21.0', rpg: '4.0', apg: '4.7' },
    clues: ['This SG won Most Improved Player in 2016 from a mid-major school', 'He wears #3 for the New Orleans Pelicans', 'CJ McCollum — sharpshooter'],
  },
  {
    id: 'porzingis', name: 'Kristaps Porzingis', team: 'Celtics', teamColor: '142 61% 30%',
    position: 'C', number: 8, nickname: 'The Unicorn', tier: 'allstar',
    videoFile: '', imageUrl: espn(3102531),
    college: 'Sevilla (Latvia)', draftYear: 2015,
    facts: ['At 7\'3" he can shoot three-pointers and block shots', 'Nicknamed "The Unicorn" for his unique skill set as a big', 'Won the 2024 NBA Championship with the Boston Celtics'],
    stats: { ppg: '19.2', rpg: '7.4', apg: '1.5' },
    clues: ['This 7\'3" C earned the nickname "The Unicorn" for his versatile skill set', 'He won a title with Boston in 2024 wearing #8', 'Kristaps Porzingis — Latvian Unicorn'],
  },
  {
    id: 'gobert', name: 'Rudy Gobert', team: 'Wolves', teamColor: '210 100% 30%',
    position: 'C', number: 27, nickname: 'The Stifle Tower', tier: 'allstar',
    videoFile: '', imageUrl: espn(3032976),
    college: 'Cholet (France)', draftYear: 2013,
    facts: ['4× NBA Defensive Player of the Year', 'His positive COVID-19 test in March 2020 triggered the NBA season suspension', 'One of the most dominant rim protectors and interior players in the modern game'],
    stats: { ppg: '14.3', rpg: '12.7', apg: '1.4' },
    clues: ['This French C has won Defensive Player of the Year 4 times', 'He wears #27 for Minnesota and stands 7\'1"', 'Rudy Gobert — The Stifle Tower'],
  },
  {
    id: 'vcarter', name: 'Vince Carter', team: 'Raptors (Ret.)', teamColor: '0 72% 51%',
    position: 'SG', number: 15, nickname: 'Vinsanity', tier: 'mvp',
    videoFile: '', imageUrl: espn(693),
    college: 'North Carolina', draftYear: 1998,
    facts: ['Considered the greatest dunker in NBA history', 'His 2000 Slam Dunk Contest performance is often called the greatest ever', 'Played an NBA-record 22 seasons in the league'],
    stats: { ppg: '16.7', rpg: '4.3', apg: '3.1' },
    clues: ['This SG played 22 NBA seasons and is considered the greatest dunker ever', 'He wore #15 and electrified Toronto in the early 2000s', 'Vince Carter — Vinsanity'],
  },
  {
    id: 'tmac', name: 'Tracy McGrady', team: 'Magic (Ret.)', teamColor: '142 71% 45%',
    position: 'SG', number: 1, nickname: 'T-Mac', tier: 'mvp',
    videoFile: '', imageUrl: espn(1974),
    college: 'Mount Zion Christian Academy (went straight to NBA)', draftYear: 1997,
    facts: ['Won back-to-back scoring titles in 2003 and 2004', 'Scored 13 points in 33 seconds to beat the Spurs in 2004', 'Vince Carter\'s cousin — both went to the NBA straight from high school'],
    stats: { ppg: '19.6', rpg: '5.6', apg: '4.4' },
    clues: ['This SG scored 13 points in 33 seconds vs. the Spurs in 2004', 'He won back-to-back scoring titles in Orlando wearing #1', 'Tracy McGrady — T-Mac'],
  },
  {
    id: 'melo', name: 'Carmelo Anthony', team: 'Knicks (Ret.)', teamColor: '210 80% 35%',
    position: 'SF', number: 7, nickname: 'Melo', tier: 'mvp',
    videoFile: '', imageUrl: espn(2544),
    college: 'Syracuse', draftYear: 2003,
    facts: ['Won the 2003 NCAA Championship with Syracuse before being drafted #3', '10× NBA All-Star and 2013 scoring champion', 'All-time leading scorer for the United States national team'],
    stats: { ppg: '22.5', rpg: '6.2', apg: '2.7' },
    clues: ['This SF won an NCAA title as a freshman then went #3 in the 2003 draft', 'He wore #7 for the Knicks and won the 2013 scoring title', 'Carmelo Anthony — Melo'],
  },
  {
    id: 'dwight', name: 'Dwight Howard', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'C', number: 39, nickname: 'Superman', tier: 'mvp',
    videoFile: '', imageUrl: espn(2384),
    college: 'Southwest Atlanta Christian Academy (went straight to NBA)', draftYear: 2004,
    facts: ['3× NBA Defensive Player of the Year (2009, 2010, 2011)', 'Dominated the 2008 Slam Dunk Contest with a Superman cape', 'Led the Orlando Magic to the 2009 NBA Finals'],
    stats: { ppg: '17.1', rpg: '12.7', apg: '1.5' },
    clues: ['This C won Defensive Player of the Year 3 straight times', 'He wore a Superman cape in the 2008 Dunk Contest', 'Dwight Howard — Superman'],
  },
  {
    id: 'pierce', name: 'Paul Pierce', team: 'Celtics (Ret.)', teamColor: '142 61% 30%',
    position: 'SF', number: 34, nickname: 'The Truth', tier: 'mvp',
    videoFile: '', imageUrl: espn(773),
    college: 'Kansas', draftYear: 1998,
    facts: ['Won the 2008 NBA Championship and Finals MVP with Boston', 'Nicknamed "The Truth" by Shaquille O\'Neal after a 2001 playoff game', 'Scored over 26,000 career points in 19 NBA seasons'],
    stats: { ppg: '19.7', rpg: '5.6', apg: '3.5' },
    clues: ['This SF got his nickname "The Truth" from Shaq after a playoff performance', 'He wore #34 for the Celtics and won Finals MVP in 2008', 'Paul Pierce — The Truth'],
  },
  {
    id: 'granthill', name: 'Grant Hill', team: 'Pistons (Ret.)', teamColor: '0 0% 20%',
    position: 'SF', number: 33, nickname: 'Grant', tier: 'mvp',
    videoFile: '', imageUrl: espn(1017),
    college: 'Duke', draftYear: 1994,
    facts: ['Co-Rookie of the Year in 1995 alongside Jason Kidd', 'Career derailed by serious ankle injuries but he persevered for 19 seasons', 'Considered one of the best all-around players of the 1990s'],
    stats: { ppg: '16.7', rpg: '6.0', apg: '4.7' },
    clues: ['This Duke SF shared Rookie of the Year in 1995 with Jason Kidd', 'He wore #33 and overcame major ankle injuries to play 19 seasons', 'Grant Hill — Detroit Pistons legend'],
  },
  {
    id: 'pau', name: 'Pau Gasol', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'PF', number: 16, nickname: 'Pau', tier: 'mvp',
    videoFile: '', imageUrl: espn(587),
    college: 'FC Barcelona (Spain)', draftYear: 2001,
    facts: ['2× NBA Champion with the Lakers (2009, 2010)', 'Won Rookie of the Year as a Spanish player in 2002', 'Widely considered the best European big man in NBA history'],
    stats: { ppg: '17.0', rpg: '9.2', apg: '3.3' },
    clues: ['This Spanish PF won two Lakers championships and Rookie of the Year in 2002', 'He wore #16 and is considered the greatest European big man ever', 'Pau Gasol — Lakers legend'],
  },
  {
    id: 'mwp', name: 'Metta World Peace', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'SF', number: 15, nickname: 'Metta', tier: 'legend',
    videoFile: '', imageUrl: espn(1066),
    college: 'St. John\'s', draftYear: 1999,
    facts: ['Changed his name from Ron Artest to Metta World Peace in 2011', 'Central figure in the infamous "Malice at the Palace" brawl in 2004', 'Won the 2009-10 NBA Championship and was beloved for his eccentricity'],
    stats: { ppg: '13.4', rpg: '4.3', apg: '2.2' },
    clues: ['This SF was at the center of the "Malice at the Palace" brawl in 2004', 'He legally changed his name from Ron Artest and won a title with the Lakers', 'Metta World Peace — formerly Ron Artest'],
  },
  {
    id: 'lamarodom', name: 'Lamar Odom', team: 'Lakers (Ret.)', teamColor: '263 52% 33%',
    position: 'PF', number: 7, nickname: 'L.O.', tier: 'legend',
    videoFile: '', imageUrl: espn(1144),
    college: 'UNLV', draftYear: 1999,
    facts: ['Won NBA Sixth Man of the Year in 2011 while winning back-to-back Lakers titles', 'Traded to Dallas for only $1 cash — a famous NBA business quirk', 'Also known for his personal life documented on reality TV'],
    stats: { ppg: '13.7', rpg: '8.4', apg: '3.8' },
    clues: ['This PF was once traded for $1 and won Sixth Man of the Year in 2011', 'He wore #7 for the Lakers and paired with Kobe and Gasol', 'Lamar Odom — L.O.'],
  },
  {
    id: 'scoot', name: 'Scoot Henderson', team: 'Blazers', teamColor: '0 72% 51%',
    position: 'PG', number: 0, nickname: 'Scoot', tier: 'rookie',
    videoFile: '', imageUrl: espn(5149786),
    college: 'G League Ignite', draftYear: 2023,
    facts: ['#3 overall pick in the 2023 NBA Draft', 'Skipped college to play in the NBA G League Ignite program', 'One of the fastest and most explosive young point guards in the league'],
    stats: { ppg: '14.9', rpg: '4.4', apg: '5.8' },
    clues: ['This PG skipped college for the G League and went #3 in 2023', 'He wears #0 for the Portland Trail Blazers', 'Scoot Henderson — young Blazers PG'],
  },
  {
    id: 'chet', name: 'Chet Holmgren', team: 'Thunder', teamColor: '210 100% 56%',
    position: 'C', number: 7, nickname: 'Chet', tier: 'pro',
    videoFile: '', imageUrl: espn(4432166),
    college: 'Gonzaga', draftYear: 2022,
    facts: ['At 7\'1" and 195 lbs, one of the most unique physical profiles in NBA history', 'Missed his entire rookie season due to injury', 'Known for elite shot-blocking despite a slender frame'],
    stats: { ppg: '16.5', rpg: '7.9', apg: '2.4' },
    clues: ['This 7\'1" C weighs just 195 lbs and plays for OKC', 'He missed his entire first season due to a foot injury', 'Chet Holmgren — Thunder center'],
  },
  {
    id: 'dwade', name: 'Dwyane Wade', team: 'Heat (Ret.)', teamColor: '0 72% 51%',
    position: 'SG', number: 3, nickname: 'Flash', tier: 'legend',
    videoFile: '', imageUrl: espn(1987),
    college: 'Marquette', draftYear: 2003,
    facts: ['3× NBA Champion and 2006 Finals MVP averaging 34.7 PPG', 'Considered one of the greatest shooting guards of all time', 'Led the Heat to the 2006 championship almost single-handedly'],
    stats: { ppg: '22.0', rpg: '4.7', apg: '5.4' },
    clues: ['This SG averaged 34.7 PPG in the 2006 Finals to win MVP', 'He wore #3 for the Miami Heat his entire career', 'Dwyane Wade — Flash'],
  },
  {
    id: 'rayallen', name: 'Ray Allen', team: 'Heat (Ret.)', teamColor: '0 72% 51%',
    position: 'SG', number: 20, nickname: 'Jesus Shuttlesworth', tier: 'legend',
    videoFile: '', imageUrl: espn(234),
    college: 'Connecticut', draftYear: 1996,
    facts: ['All-time leader in three-pointers made at the time of his retirement', 'Hit the iconic corner three to force overtime in Game 6 of the 2013 Finals', 'Played "Jesus Shuttlesworth" in Spike Lee\'s He Got Game (1998)'],
    stats: { ppg: '18.9', rpg: '4.1', apg: '3.4' },
    clues: ['This SG hit the corner three to save the 2013 Finals for Miami in Game 6', 'He wore #20 and was the all-time three-point record holder at retirement', 'Ray Allen — Jesus Shuttlesworth'],
  },
  {
    id: 'malone', name: 'Karl Malone', team: 'Jazz (Ret.)', teamColor: '210 100% 30%',
    position: 'PF', number: 32, nickname: 'The Mailman', tier: 'legend',
    videoFile: '', imageUrl: espn(1089),
    college: 'Louisiana Tech', draftYear: 1985,
    facts: ['2× NBA MVP (1997, 1999) and 14× All-Star', 'Second all-time leading scorer in NBA history behind only Kareem (until LeBron)', 'Formed one of the most iconic duos in NBA history with John Stockton'],
    stats: { ppg: '25.0', rpg: '10.1', apg: '3.6' },
    clues: ['This PF was the second all-time scorer and paired with John Stockton for his entire career', 'He wore #32 for Utah and won two MVP awards', 'Karl Malone — The Mailman'],
  },
];

export function getPlayersByTier(tier: DifficultyTier): Player[] {
  return PLAYERS.filter(p => p.tier === tier);
}

export function generateChoices(correct: Player, allPlayers: Player[], wrongCount: 1 | 3 = 3): Player[] {
  // Prefer same-tier players as wrong choices for better difficulty balance
  const sameTier = allPlayers.filter(p => p.id !== correct.id && p.tier === correct.tier);
  const otherTier = allPlayers.filter(p => p.id !== correct.id && p.tier !== correct.tier);
  const shuffledSame = [...sameTier].sort(() => Math.random() - 0.5);
  const shuffledOther = [...otherTier].sort(() => Math.random() - 0.5);
  const wrongChoices = [...shuffledSame, ...shuffledOther].slice(0, wrongCount);
  // Ensure we always have enough wrong choices (fall back if not enough players)
  const safeWrong = wrongChoices.length >= wrongCount
    ? wrongChoices
    : [...allPlayers.filter(p => p.id !== correct.id).sort(() => Math.random() - 0.5)].slice(0, wrongCount);
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
