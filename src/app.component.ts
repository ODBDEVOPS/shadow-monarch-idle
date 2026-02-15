
import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, WritableSignal, Signal } from '@angular/core';

type View = 'Dashboard' | 'Army' | 'Skills' | 'Dungeons' | 'Inventory' | 'Menu' | 'Ascension' | 'Raids' | 'Monarchs' | 'Quests' | 'Gates';
type SortBy = 'name' | 'rank' | 'level';
type SortDirection = 'asc' | 'desc';

interface NavItem {
  id: View;
  name: string;
  icon: string;
}

interface Upgrade {
  name:string;
  cost: number;
  bonus: string;
  purchased: boolean;
  levelRequirement: number;
}

interface Unit {
  name: string;
  icon: string;
  rank: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: {
    hp: string;
    attack: string;
    defense: string;
    speed: string;
  };
  upgrades: Upgrade[];
}

interface PlayerSkill {
  name: string;
  description: string;
  cooldown: number; // in seconds
  onCooldown: boolean;
  cooldownTimer: number;
  action: () => void;
}

// Skill Tree Interfaces
interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
}

interface SkillTree {
  name: 'Warrior' | 'Sovereign';
  skills: Skill[];
}

// Inventory Interfaces
interface Artifact {
  id: number;
  name: string;
  icon: string;
  bonus: string;
  bonusValue: number; // For calculation
  bonusType: 'mana' | 'xp' | 'attack' | 'hp' | 'defense' | 'crit' | 'essence'; // For now, can be expanded
  equipped: boolean;
}

interface InventoryItem {
  id: number;
  name: string;
  icon: string;
  description: string;
  quantity: number;
}

interface CurrencyItem {
  name: string;
  icon: string;
  description: string;
  amount: Signal<number>;
}

// Quest Interfaces
interface QuestObjective {
  id: string;
  description: string;
  target: number;
  progress: WritableSignal<number>;
  isComplete: Signal<boolean>;
}

// FIX: Define a specific type for quest statuses to avoid type inference issues.
type QuestStatus = 'Locked' | 'Available' | 'InProgress' | 'Completed' | 'Claimed';

interface Quest {
  id: string;
  title: string;
  type: 'Combat' | 'Investigation' | 'Endurance' | 'Extraction' | 'Social' | 'Exploration';
  rankRequirement: number; // Player Level
  synopsis: string;
  objectives: QuestObjective[];
  rewards: {
    mana?: number;
    gems?: number;
    shadowEssence?: number;
    items?: { id: number; quantity: number }[];
    artifact?: Omit<Artifact, 'equipped'>;
    skill?: Omit<PlayerSkill, 'onCooldown' | 'cooldownTimer'>;
  };
  narrativeImpact: string;
  gameplayImpact: string;
  status: WritableSignal<QuestStatus>;
}


// Dungeon Interface
interface Dungeon {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  status: 'Idle' | 'InProgress' | 'Completed';
  remainingTime: WritableSignal<number>;
  timerInterval?: any;
  rewards: {
    type: 'mana' | 'xp' | 'gems';
    amount: number;
  };
  icon: string; // Emoji icon for UI
}

// Raid Interfaces
interface RaidBoss {
  id: string;
  name: string;
  totalHp: number;
  currentHp: WritableSignal<number>;
  phases: number;
  currentPhase: WritableSignal<number>;
  status: 'InProgress' | 'Defeated' | 'Expired';
  timer: WritableSignal<number>;
  timerInterval?: any;
}

interface RaidLeaderboardEntry {
  rank: number;
  name: string;
  damageDealt: WritableSignal<number>;
  isPlayer: boolean;
}

// Monarch Interfaces
type MonarchType = 'Shadow' | 'Beast' | 'Ice' | 'Destruction' | 'Light';

interface MonarchSkill extends Skill {
  tier: number;
  cost: number;
}

interface Monarch {
  id: MonarchType;
  name: string;
  description: string;
  uniqueUnitName: string;
  passiveBonuses: string[];
  ultimateName: string;
  skillTree: MonarchSkill[];
}

// Procedural Dungeon Interfaces
type BiomeType = 'Shadow Crypt' | 'Frost Cave';
type DungeonFloorType = 'Combat' | 'Event' | 'Treasure' | 'Boss';
type ProceduralDungeonStatus = 'Exploring' | 'Event' | 'Boss' | 'Completed' | 'Failed';

interface DungeonEventResult {
  outcomeText: string;
  rewards?: { mana?: number; gems?: number };
  staminaChange?: number;
}

interface DungeonEventOption {
  text: string;
  action: () => DungeonEventResult;
}

interface DungeonEvent {
  id: string;
  description: string;
  options: DungeonEventOption[];
}

interface DungeonFloor {
  type: DungeonFloorType;
  difficultyModifier: number;
  event?: DungeonEvent;
  isCleared: boolean;
  encounterText: string;
}

interface AccumulatedRewards {
  mana: number;
  gems: number;
}

interface GeneratedDungeon {
  id: string;
  name: string;
  biome: BiomeType;
  floors: DungeonFloor[];
  currentFloor: number;
  depth: number;
  stamina: number;
  maxStamina: number;
  status: ProceduralDungeonStatus;
  accumulatedRewards: AccumulatedRewards;
  lastEventResult: WritableSignal<DungeonEventResult | null>;
}


const getInitialArmyUnits = (): Unit[] => [
    { name: 'Infantry', icon: '🛡️', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 100, stats: { hp: '1.2K', attack: '50', defense: '150', speed: 'Low' }, 
      upgrades: [
        { name: 'Rank D Evolution', cost: 100000, bonus: '+10% HP', purchased: false, levelRequirement: 10 },
        { name: 'Rank C Evolution', cost: 500000, bonus: '+20% Defense', purchased: false, levelRequirement: 25 },
        { name: 'Rank B: Provocation', cost: 1000000, bonus: '+30% Defense', purchased: false, levelRequirement: 50 },
        { name: 'Rank A Evolution', cost: 2500000, bonus: '+30% HP', purchased: false, levelRequirement: 75 },
        { name: 'Rank S: AoE Shadow Shield', cost: 5000000, bonus: '+25% HP & +25% Defense', purchased: false, levelRequirement: 100 }
      ] 
    },
    { name: 'Assassin', icon: '🗡️', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 120, stats: { hp: '450', attack: '210', defense: '30', speed: 'Very High' }, upgrades: [{ name: 'Phantom Strike', cost: 2000000, bonus: '+5% Attack', purchased: false, levelRequirement: 95 }] },
    { name: 'Mage', icon: '🔮', rank: 'SS', level: 1, experience: 0, experienceToNextLevel: 110, stats: { hp: '600', attack: '180', defense: '45', speed: 'Medium' }, upgrades: [{ name: 'Void Explosion', cost: 1800000, bonus: '+5% Attack', purchased: false, levelRequirement: 90 }] },
    { name: 'Archer', icon: '🏹', rank: 'S', level: 1, experience: 0, experienceToNextLevel: 90, stats: { hp: '550', attack: '190', defense: '40', speed: 'High' }, upgrades: [{ name: 'Shadow Arrow', cost: 1600000, bonus: '+5% Attack', purchased: false, levelRequirement: 85 }] },
    { name: 'Knight', icon: '🐴', rank: 'S', level: 1, experience: 0, experienceToNextLevel: 95, stats: { hp: '900', attack: '110', defense: '120', speed: 'Medium' }, upgrades: [{ name: 'Dark Charge', cost: 1700000, bonus: '+5% HP', purchased: false, levelRequirement: 85 }] },
    { name: 'Dragon', icon: '🐉', rank: 'A', level: 1, experience: 0, experienceToNextLevel: 200, stats: { hp: '2.5K', attack: '350', defense: '200', speed: 'Medium' }, upgrades: [{ name: 'Void Breath', cost: 5000000, bonus: '+10% Attack', purchased: false, levelRequirement: 75 }] },
];

const getInitialSkillTrees = (): SkillTree[] => [
    {
      name: 'Warrior',
      skills: [
        { id: 'w1', name: 'Army Attack', description: '+2% Total Attack Power', level: 0, maxLevel: 10 },
        { id: 'w2', name: 'Army Vigor', description: '+2% Total HP', level: 0, maxLevel: 10 },
        { id: 'w3', name: 'Critical Strike', description: '+1% Critical Chance', level: 0, maxLevel: 5 },
      ]
    },
    {
      name: 'Sovereign',
      skills: [
        { id: 's1', name: 'Mana Affinity', description: '+5% Mana from monsters', level: 0, maxLevel: 10 },
        { id: 's2', name: 'Accelerated Growth', description: '+5% XP from monsters', level: 0, maxLevel: 10 },
        { id: 's3', name: 'Click Proficiency', description: '+10% Mana from clicks', level: 0, maxLevel: 5 },
      ]
    }
];


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  activeView = signal<View>('Dashboard');
  selectedUnit = signal<Unit | null>(null);
  mana = signal(5_000_000);
  gems = signal(25_000);
  notification = signal<string | null>(null);

  // Player State
  playerLevel = signal(50);
  playerExperience = signal(15000);
  playerExperienceToNextLevel = signal(25000);
  skillPoints = signal(10);
  playerRank = computed(() => {
    const level = this.playerLevel();
    if (level < 10) return 'E';
    if (level < 20) return 'D';
    if (level < 30) return 'C';
    if (level < 40) return 'B';
    if (level < 50) return 'A';
    if (level < 75) return 'S';
    if (level < 100) return 'SS';
    return 'SSS';
  });
  playerHP = computed(() => this.playerLevel() * 150);
  playerAttack = computed(() => this.playerLevel() * 10);
  playerDefense = computed(() => this.playerLevel() * 5);


  // Auto-Combat State
  currentZone = signal(123);
  currentWave = signal(4);
  isFightingBoss = computed(() => this.currentWave() === 10);
  isZoneBoss = computed(() => this.isFightingBoss() && this.currentZone() % 10 === 0);
  enemyName = computed(() => {
    if (this.isZoneBoss()) return 'ZONE BOSS';
    if (this.isFightingBoss()) return 'Mini-Boss';
    return 'Monsters';
  });
  private autoCombatInterval: any;

  // Sorting and Filtering State
  searchTerm = signal('');
  sortBy = signal<SortBy>('rank');
  sortDirection = signal<SortDirection>('desc');
  
  // Skills State
  activeSkillTree = signal<'Warrior' | 'Sovereign'>('Warrior');
  skillTrees = signal<SkillTree[]>(getInitialSkillTrees());
  
  // Inventory State
  activeInventoryTab = signal<'Artifacts' | 'Items' | 'Currencies'>('Artifacts');
  artifacts = signal<Artifact[]>([
    { id: 1, name: 'Crown of the Void', icon: '👑', bonus: '+10% Mana Gain', bonusValue: 0.1, bonusType: 'mana', equipped: true },
    { id: 2, name: 'Sovereign\'s Eye', icon: '👁️', bonus: '+5% Mana Gain', bonusValue: 0.05, bonusType: 'mana', equipped: false },
    { id: 3, name: 'Shadow Heart', icon: '🖤', bonus: '+15% Mana Gain', bonusValue: 0.15, bonusType: 'mana', equipped: false },
  ]);
  inventoryItems = signal<InventoryItem[]>([
      { id: 1, name: 'Dungeon Key', icon: '🔑', description: 'Unlocks a special dungeon.', quantity: 5 },
      { id: 2, name: 'Raid Ticket', icon: '🎟️', description: 'Allows entry to a raid.', quantity: 2 },
  ]);
  maxEquippedArtifacts = 3;
  equippedArtifacts = computed(() => this.artifacts().filter(a => a.equipped));
  
  // Ascension State
  ascensionCount = signal(0);
  shadowEssence = signal(0);
  sovereignPoints = signal(0);
  minZoneForAscension = 100;
  ascensionReady = computed(() => this.currentZone() >= this.minZoneForAscension);
  
  // Dungeons State
  dungeons = signal<Dungeon[]>([]);

  // Raids State
  raidBoss = signal<RaidBoss | null>(null);
  raidLeaderboard = signal<RaidLeaderboardEntry[]>([]);
  isRaiding = signal(false);
  private raidDamageInterval: any;
  hasClaimedRaidRewards = signal(false);

  // Monarchs State
  isMonarchSystemUnlocked = computed(() => this.ascensionCount() >= 10);
  chosenMonarch = signal<MonarchType | null>(null);
  monarchs: Monarch[] = [];
  activeMonarch = computed(() => this.monarchs.find(m => m.id === this.chosenMonarch()));
  
  // Quest State
  quests = signal<Quest[]>([]);
  activeQuestTab = signal<'InProgress' | 'Available' | 'Completed'>('InProgress');
  selectedQuest = signal<Quest | null>(null);
  availableQuests = computed(() => this.quests().filter(q => q.status() === 'Available' && this.playerLevel() >= q.rankRequirement));
  inProgressQuests = computed(() => this.quests().filter(q => q.status() === 'InProgress'));
  completedQuests = computed(() => this.quests().filter(q => q.status() === 'Completed' || q.status() === 'Claimed'));

  // Procedural Dungeon State
  proceduralDungeonsView = signal<'Selection' | 'Exploring' | 'Results'>('Selection');
  activeGeneratedDungeon = signal<GeneratedDungeon | null>(null);
  dungeonRunResult = signal<{ status: 'Completed' | 'Failed', rewards: AccumulatedRewards } | null>(null);
  private dungeonEvents: DungeonEvent[] = [];

  // Permanent Bonuses
  permanentManaBonus = computed(() => this.ascensionCount() * 0.1); // +10% mana per ascension
  monarchEssenceBonus = computed(() => {
    const baseBonus = this.chosenMonarch() === 'Shadow' ? 0.1 : 0;
    const artifactBonus = this.artifacts().find(a => a.id === 12 && a.equipped)?.bonusValue ?? 0;
    return baseBonus + artifactBonus;
  });
  
  // Calculated Bonuses
  ascensionEssenceGain = computed(() => {
    if (!this.ascensionReady()) return 0;
    const baseGain = Math.floor(Math.pow(this.currentZone() - this.minZoneForAscension + 10, 1.5));
    return Math.floor(baseGain * (1 + this.monarchEssenceBonus()));
  });
  ascensionPointsGain = computed(() => this.ascensionReady() ? Math.floor((this.currentZone() - this.minZoneForAscension) / 25) + 1 : 0);
  private manaOverloadBonus = signal(1);
  manaGainBonus = computed(() => this.equippedArtifacts().filter(a => a.bonusType === 'mana').reduce((acc, artifact) => acc + artifact.bonusValue, 0));
  totalArmyAttack = computed(() => this.armyUnits().reduce((acc, unit) => acc + this.parseStat(unit.stats.attack), 0));

  formattedMana = computed(() => this.formatStat(this.mana()));
  formattedGems = computed(() => this.formatStat(this.gems()));
  
  playerDamageDealt = computed(() => {
    const playerEntry = this.raidLeaderboard().find(e => e.isPlayer);
    return playerEntry?.damageDealt() ?? 0;
  });
  
  playerRaidRank = computed(() => {
      const playerEntry = this.raidLeaderboard().find(e => e.isPlayer);
      return playerEntry ? playerEntry.rank : this.raidLeaderboard().length + 1;
  });

  currencyItems = computed<CurrencyItem[]>(() => [
    { name: 'Mana', icon: '💰', description: 'Core currency for most upgrades.', amount: this.mana },
    { name: 'Gems', icon: '💎', description: 'Premium currency for rare items.', amount: this.gems },
    { name: 'Shadow Essence', icon: '👻', description: 'Earned from Ascensions for permanent bonuses.', amount: this.shadowEssence },
    { name: 'Sovereign Points', icon: '👑', description: 'Earned from high-level Ascensions for Monarch talents.', amount: this.sovereignPoints }
  ]);
  
  // Dashboard computed properties
  dashboardQuests = computed(() => this.inProgressQuests().slice(0, 3));
  expeditedDungeon = computed(() => {
    const inProgress = this.dungeons().filter(d => d.status === 'InProgress');
    if (inProgress.length === 0) return null;
    return inProgress.sort((a, b) => a.remainingTime() - b.remainingTime())[0];
  });

  navItems: NavItem[] = [
    { id: 'Dashboard', name: 'Dashboard', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>' },
    { id: 'Army', name: 'Army', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>' },
    { id: 'Gates', name: 'Gates', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>'},
    { id: 'Inventory', name: 'Inventory', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>' },
    { id: 'Menu', name: 'Menu', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>' },
  ];
  
  menuItems: { name: string, id: View }[] = [
    { name: 'Ascension', id: 'Ascension' },
    { name: 'Skills', id: 'Skills' },
    { name: 'Dungeons', id: 'Dungeons' },
    { name: 'Raids', id: 'Raids' },
    { name: 'Monarchs', id: 'Monarchs' },
    { name: 'Quests', id: 'Quests' },
    { name: 'Settings', id: 'Menu' }, // Placeholder
  ];

  armyUnits = signal<Unit[]>(this.initializeArmy());
  
  private clickManaBonus = signal(1); // multiplier
  skills = signal<PlayerSkill[]>([
    { name: 'Frenzy', description: 'Boosts mana-per-click for 10s.', cooldown: 60, onCooldown: false, cooldownTimer: 60, action: () => {
        this.clickManaBonus.set(5);
        setTimeout(() => this.clickManaBonus.set(1), 10000);
    }},
    { name: 'Shadow Rush', description: 'Instantly completes the current wave.', cooldown: 120, onCooldown: false, cooldownTimer: 120, action: () => this.progressWave(true) }
  ]);

  private rankOrder: { [key: string]: number } = { 'A': 1, 'S': 2, 'SS': 3, 'SSS': 4 };

  filteredAndSortedUnits = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const by = this.sortBy();
    const direction = this.sortDirection();

    const filtered = this.armyUnits().filter(unit => unit.name.toLowerCase().includes(term));

    return filtered.sort((a, b) => {
      let compare = 0;
      switch (by) {
        case 'name':
          compare = a.name.localeCompare(b.name);
          break;
        case 'level':
          compare = a.level - b.level;
          break;
        case 'rank':
          compare = (this.rankOrder[a.rank] || 0) - (this.rankOrder[b.rank] || 0);
          break;
      }
      return direction === 'asc' ? compare : -compare;
    });
  });
  
  initializeArmy(): Unit[] {
    return getInitialArmyUnits().map(u => ({...u, level: 50, experience: 15000, experienceToNextLevel: 25000, stats: { hp: '1.2M', attack: '50K', defense: '150K', speed: 'Low' }}));
  }


  ngOnInit() {
    this.startAutoCombat();
    this.initializeDungeons();
    this.initializeRaid();
    this.initializeMonarchs();
    this.initializeQuests();
    this.initializeDungeonEvents();
  }

  ngOnDestroy() {
    clearInterval(this.autoCombatInterval);
    this.dungeons().forEach(d => {
        if (d.timerInterval) clearInterval(d.timerInterval);
    });
    const raid = this.raidBoss();
    if(raid && raid.timerInterval) clearInterval(raid.timerInterval);
    if(this.raidDamageInterval) clearInterval(this.raidDamageInterval);
  }

  initializeDungeons() {
    const dungeonData: {
        id: string; name: string; description: string; duration: number;
        rewards: { type: 'mana' | 'xp' | 'gems'; amount: number; }; icon: string;
    }[] = [
        { id: 'gold', name: 'Gold Dungeon', description: 'Yields a massive amount of Mana.', duration: 3600, rewards: { type: 'mana', amount: 5_000_000 }, icon: '💰' },
        { id: 'xp', name: 'XP Dungeon', description: 'Grants a huge boost of experience.', duration: 7200, rewards: { type: 'xp', amount: 100_000 }, icon: '⭐' },
        { id: 'artifact', name: 'Artifact Dungeon', description: 'A chance to find precious Gems.', duration: 14400, rewards: { type: 'gems', amount: 500 }, icon: '👑' },
        { id: 'elite', name: 'Elite Dungeon', description: 'High-tier Mana expedition.', duration: 28800, rewards: { type: 'mana', amount: 25_000_000 }, icon: '⚔️' },
        { id: 'boss', name: 'Boss Dungeon', description: 'Defeat a boss for a large Gem bounty.', duration: 43200, rewards: { type: 'gems', amount: 2000 }, icon: '💀' },
        { id: 'dragon', name: 'Dragon\'s Lair', description: 'The ultimate challenge for immense XP.', duration: 86400, rewards: { type: 'xp', amount: 1_000_000 }, icon: '🐲' }
    ];

    this.dungeons.set(dungeonData.map(d => ({
        ...d, status: 'Idle', remainingTime: signal(d.duration),
    })));
  }
  
  initializeRaid() {
    const bossHp = 1_000_000_000_000;
    const boss: RaidBoss = {
        id: 'weekly_boss_1',
        name: 'Kamish, the Void Dragon',
        totalHp: bossHp,
        currentHp: signal(bossHp),
        phases: 3,
        currentPhase: signal(1),
        status: 'InProgress',
        timer: signal(604800), // 7 days
    };
    
    boss.timerInterval = setInterval(() => {
        boss.timer.update(t => t - 1);
        if (boss.timer() <= 0) {
            clearInterval(boss.timerInterval);
            boss.status = 'Expired';
            this.isRaiding.set(false);
            this.showNotification("The Raid has ended!");
        }
    }, 1000);

    this.raidBoss.set(boss);
    
    const mockLeaderboard: RaidLeaderboardEntry[] = [
        { rank: 1, name: 'Zephyr', damageDealt: signal(this.totalArmyAttack() * 15000), isPlayer: false },
        { rank: 2, name: 'SovereignX', damageDealt: signal(this.totalArmyAttack() * 12000), isPlayer: false },
        { rank: 3, name: 'You', damageDealt: signal(0), isPlayer: true },
        { rank: 4, name: 'Luna', damageDealt: signal(this.totalArmyAttack() * 8000), isPlayer: false },
        { rank: 5, name: 'Goliath', damageDealt: signal(this.totalArmyAttack() * 5000), isPlayer: false },
    ];
    this.raidLeaderboard.set(mockLeaderboard);
  }

  initializeMonarchs() {
    this.monarchs = [
      { id: 'Shadow', name: 'Monarch of Shadows', description: 'Control the battlefield with an ever-growing army and drain your foes.', uniqueUnitName: 'Shadow General', passiveBonuses: ['+10% Shadow Essence from all sources.', '+20% HP for all Infantry units.'], ultimateName: 'March of Shadows',
        skillTree: [
            { id: 'ms1_1', name: 'Army Damage', description: '+10% Army Damage', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'ms1_2', name: 'Army HP', description: '+10% Army HP', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'ms2_1', name: 'Attack Speed', description: '+20% Attack Speed', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'ms2_2', name: 'Progression Speed', description: '+20% Progression Speed', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'ms3_1', name: 'Critical Damage', description: '+15% Critical Damage', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'ms3_2', name: 'Critical Chance', description: '+15% Critical Chance', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'ms4_1', name: 'Max Elite Unit', description: '+1 Max Elite Unit', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'ms4_2', name: 'Auto Extraction', description: '+10% Auto Extraction', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'ms5_1', name: 'Permanent Shadow Army', description: '+50% Global Stats', level: 0, maxLevel: 1, tier: 5, cost: 10 },
      ]},
      { id: 'Beast', name: 'Monarch of Beasts', description: 'Overwhelm your enemies with ferocious power and critical strikes.', uniqueUnitName: 'Giant Wolf', passiveBonuses: ['+10% Damage for Dragon units.', '+5% global critical hit chance.'], ultimateName: 'Primordial Roar',
        skillTree: [
            { id: 'mb1_1', name: 'Savage Power', description: '+10% Beast & Dragon Damage', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'mb1_2', name: 'Tough Hide', description: '+10% Beast & Dragon HP', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'mb2_1', name: 'Frenzy', description: '+20% Attack Speed for Beasts', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'mb2_2', name: 'Swift Wings', description: '+20% Progression Speed', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'mb3_1', name: 'Deep Wounds', description: '+25% Critical Damage', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'mb4_1', name: 'Boss Hunter', description: '+50% Damage to Bosses', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'mb5_1', name: 'Primal Rage', description: '+50% Beast & Dragon Global Stats', level: 0, maxLevel: 1, tier: 5, cost: 10 },
      ]},
      { id: 'Ice', name: 'Monarch of Frost', description: 'Freeze the battlefield, controlling your enemies and fortifying your army.', uniqueUnitName: 'Ice Golem', passiveBonuses: ['All attacks have a 5% chance to briefly slow enemies.', '+15% global army defense.'], ultimateName: 'Eternal Winter',
        skillTree: [
            { id: 'mi1_1', name: 'Glacial Armor', description: '+20% Army Defense', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'mi1_2', name: 'Frozen Core', description: '+15% Army HP', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'mi2_1', name: 'Chilling Aura', description: '+10% Slow Chance', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'mi3_1', name: 'Permafrost', description: 'Slowed enemies take 20% more damage', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'mi4_1', name: 'Unbreakable', description: '+100% Army Defense', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'mi5_1', name: 'Ice Age', description: '+50% Global Defensive Stats & Slow Effect', level: 0, maxLevel: 1, tier: 5, cost: 10 },
      ]},
      { id: 'Destruction', name: 'Monarch of Destruction', description: 'Annihilate everything with pure, chaotic power and accelerate your progression.', uniqueUnitName: 'Chaos Knight', passiveBonuses: ['+10% global attack power.', '+20% idle speed.'], ultimateName: 'Void Assault',
        skillTree: [
            { id: 'md1_1', name: 'Boss Slayer', description: '+10% Damage vs Bosses', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'md1_2', name: 'Elite Hunter', description: '+10% Damage vs Elites', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'md2_1', name: 'Idle Speed', description: '+20% Idle Speed', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'md2_2', name: 'Idle Loot', description: '+20% Idle Loot', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'md3_1', name: 'Zone Multiplier', description: '+15% Zone Multiplier', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'md3_2', name: 'AoE Damage', description: '+15% AoE Damage', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'md4_1', name: 'Active Skill Slot', description: '+1 Active Skill Slot', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'md4_2', name: 'Cooldown Reduction', description: '-20% Skill Cooldowns', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'md5_1', name: 'Void Assault', description: '+200% damage for 10s every 60s', level: 0, maxLevel: 1, tier: 5, cost: 10 },
      ]},
      { 
        id: 'Light', 
        name: 'Monarch of Light', 
        description: 'Lead your forces with unmatched strategy, enhancing their power and accelerating your path to supremacy.', 
        uniqueUnitName: 'Light Sentinel', 
        passiveBonuses: ['+10% Global Army Stats.', '+10% Shadow Essence gain from Ascension.'], 
        ultimateName: 'Monarch\'s Crown',
        skillTree: [
            { id: 'ml1_1', name: 'Soldier HP', description: '+10% Soldier HP', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'ml1_2', name: 'Soldier Speed', description: '+10% Soldier Speed', level: 0, maxLevel: 1, tier: 1, cost: 1 },
            { id: 'ml2_1', name: 'Army Damage', description: '+20% Army Damage', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'ml2_2', name: 'Army Defense', description: '+20% Army Defense', level: 0, maxLevel: 1, tier: 2, cost: 2 },
            { id: 'ml3_1', name: 'Legendary Capacity', description: '+1 Max Legendary Soldier', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'ml3_2', name: 'Soul Harvest', description: '+10% Rare Soul Drop Chance', level: 0, maxLevel: 1, tier: 3, cost: 3 },
            { id: 'ml4_1', name: 'Ascension Pact', description: '+20% Ascension Bonus', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'ml4_2', name: 'Essence Collector', description: '+20% Shadow Essence', level: 0, maxLevel: 1, tier: 4, cost: 5 },
            { id: 'ml5_1', name: 'Monarch\'s Crown', description: '+100% global stats for 30s after each boss', level: 0, maxLevel: 1, tier: 5, cost: 10 },
        ]
      },
    ];
  }

  initializeQuests() {
    const questData: Omit<Quest, 'objectives' | 'status'>[] = [
      // Chapter 1
      {
        id: 'q4_prix_du_pain', title: "Le Prix du Pain", type: 'Social', rankRequirement: 5,
        synopsis: "Une boulangère est rackettée par des chasseurs de bas rang. Apprenez-leur les bonnes manières.",
        rewards: { mana: 10000, items: [{ id: 1, quantity: 1 }] },
        narrativeImpact: "La boulangère est reconnaissante. Vous gagnez en réputation dans le quartier.",
        gameplayImpact: "Débloque des réductions en ville ou un futur allié."
      },
      {
        id: 'q5_rat_du_donjon', title: "Le Rat du Donjon", type: 'Exploration', rankRequirement: 5,
        synopsis: "Un mini-portail instable est apparu dans les égouts, crachant des créatures. Nettoyez la zone et fermez la faille.",
        rewards: { mana: 15000, shadowEssence: 100 },
        narrativeImpact: "Votre intervention rapide a empêché une brèche plus grande. Vous comprenez mieux les anomalies.",
        gameplayImpact: "Introduction aux anomalies de portail."
      },
      {
        id: 'q6_frere_disparu', title: "Le Frère Disparu", type: 'Investigation', rankRequirement: 10,
        synopsis: "Un jeune garçon est mort d'inquiétude. Son frère aîné, un nouveau chasseur, a disparu dans un donjon de rang D.",
        rewards: { mana: 25000, artifact: { id: 5, name: "Charme de Fraternité", icon: '🤝', bonus: '+2% Army HP', bonusValue: 0.02, bonusType: 'hp' } },
        narrativeImpact: "Le frère est sauvé. Vous avez gagné la loyauté d'une famille.",
        gameplayImpact: "Le frère sauvé pourrait devenir un PNJ marchand ou informateur plus tard."
      },
      {
        id: 'q7_nettoyeur', title: "Le Nettoyeur", type: 'Combat', rankRequirement: 15,
        synopsis: "Une équipe de chasseurs a bâclé son travail, laissant un donjon 'presque' vide. Terminez le nettoyage et récupérez ce qu'ils ont laissé.",
        rewards: { mana: 50000, shadowEssence: 500 },
        narrativeImpact: "Un travail propre. Vous commencez à vous faire un nom pour votre efficacité.",
        gameplayImpact: "Encourage à la fois le combat actif et les expéditions de donjon."
      },
      // Chapter 2
      {
        id: 'q8_guilde_fantome', title: "La Guilde Fantôme", type: 'Investigation', rankRequirement: 20,
        synopsis: "Une guilde entière a disparu sans laisser de traces dans un donjon de rang C. Découvrez ce qui s'est passé.",
        rewards: { mana: 100000, artifact: {id: 6, name: "Monarch's Fragment", icon: '💠', bonus: '+5% Army Attack', bonusValue: 0.05, bonusType: 'attack'}},
        narrativeImpact: "Vous avez trouvé des traces d'une puissance obscure bien au-delà de ce que vous avez jamais affronté.",
        gameplayImpact: "Premiers indices sur les Monarques et les dangers à venir."
      },
      {
        id: 'q9_contrat_jinho', title: "Le Contrat de Jin-ho", type: 'Social', rankRequirement: 25,
        synopsis: "Votre ami, Jin-ho, a besoin de votre aide pour un raid de guilde afin de prouver sa valeur. Assurez-vous que tout se passe bien.",
        rewards: { mana: 50000, artifact: {id: 7, name: "Jin-ho's Charm", icon: '🧑‍🤝‍🧑', bonus: '+5% XP Gain', bonusValue: 0.05, bonusType: 'xp'}},
        narrativeImpact: "Votre amitié avec Jin-ho est plus forte que jamais. Il vous est redevable.",
        gameplayImpact: "Débloque potentiellement des quêtes exclusives avec Jin-ho plus tard."
      },
       {
        id: 'q10_larmes_de_fer', title: "Les Larmes de Fer", type: 'Combat', rankRequirement: 25,
        synopsis: "Un forgeron légendaire a besoin de minerais rares gardés par des golems de pierre dans les zones intermédiaires.",
        rewards: { mana: 250000, gems: 100 },
        narrativeImpact: "Le forgeron est impressionné par votre force et vous promet ses services.",
        gameplayImpact: "Débloque la possibilité de 'crafter' des équipements avancés (feature future)."
      },
      {
        id: 'q11_chasseuse_aveugle', title: "La Chasseuse Aveugle", type: 'Investigation', rankRequirement: 30,
        synopsis: "Une chasseuse de renom a perdu la vue suite à une malédiction dans un donjon. Trouvez la source de cette malédiction.",
        rewards: { artifact: { id: 8, name: "Eye of Insight", icon: '🧿', bonus: '+2% Critical Chance', bonusValue: 0.02, bonusType: 'crit' }},
        narrativeImpact: "Vous avez absorbé une partie de la malédiction, aiguisant vos propres sens. La chasseuse vous met en garde contre les forces que vous manipulez.",
        gameplayImpact: "Un choix moral qui pourrait avoir des conséquences narratives futures."
      },
      {
        id: 'q12_marche_noir', title: "Le Marché Noir", type: 'Exploration', rankRequirement: 35,
        synopsis: "Un marché souterrain pour des objets de donjon illégaux existe en ville. Infiltrez-le pour voir ce que vous pouvez trouver.",
        rewards: { gems: 500, mana: 500000 },
        narrativeImpact: "Vous avez maintenant accès à un réseau d'informations et d'objets que peu de chasseurs connaissent.",
        gameplayImpact: "Débloque l'accès à une boutique 'Marché Noir' (feature future)."
      },
       // Chapter 3
      {
        id: 'q13_chant_dragon', title: "Le Chant du Dragon", type: 'Combat', rankRequirement: 40,
        synopsis: "Un œuf de dragon instable menace d'exploser, libérant des ondes de mana pures et dangereuses. Trouvez-le et neutralisez la menace.",
        rewards: { artifact: {id: 9, name: "Draconic Shadow Essence", icon: '🐲', bonus: '+10% Mana Gain', bonusValue: 0.1, bonusType: 'mana'}},
        narrativeImpact: "L'essence du dragon imprègne votre ombre, un avant-goût des pouvoirs draconiques liés à Kamish.",
        gameplayImpact: "Influence la future quête principale de Kamish."
      },
      {
        id: 'q14_ombres_perdues', title: "Les Ombres Perdues", type: 'Investigation', rankRequirement: 45,
        synopsis: "Certains de vos soldats d'ombre les plus anciens montrent des signes d'insubordination, corrompus par une influence extérieure.",
        rewards: { artifact: {id: 10, name: "Sovereign's Command", icon: '👑', bonus: '+5% Army HP', bonusValue: 0.05, bonusType: 'hp'}},
        narrativeImpact: "Vous comprenez mieux la nature du Système et le lien fragile qui unit le monarque à ses ombres.",
        gameplayImpact: "Développe le lore du Système et de vos pouvoirs."
      },
      {
        id: 'q15_danse_lame', title: "La Danse de la Lame", type: 'Combat', rankRequirement: 50,
        synopsis: "La chasseuse de rang S, Cha Hae-in, a entendu parler de votre puissance et souhaite vous tester dans un duel amical.",
        rewards: { artifact: {id: 11, name: "Cha Hae-in's Scarf", icon: '🧣', bonus: '+5% Army Defense', bonusValue: 0.05, bonusType: 'defense'}},
        narrativeImpact: "Vous avez gagné le respect (et peut-être l'intérêt) de l'une des plus grandes chasseuses.",
        gameplayImpact: "Débloque une future alliance ou des options de romance."
      },
       {
        id: 'q16_coeur_donjon', title: "Le Cœur du Donjon", type: 'Exploration', rankRequirement: 55,
        synopsis: "Un donjon unique possède un 'cœur' qui régule son mana. Il est devenu instable et menace de créer une 'Dungeon Break'.",
        rewards: { artifact: { id: 12, name: "Dungeon Core Fragment", icon: '💎', bonus: '+25% Shadow Essence Gain', bonusValue: 0.25, bonusType: 'essence' }},
        narrativeImpact: "Votre contrôle sur le mana des donjons s'est accru, vous permettant de manipuler leur structure.",
        gameplayImpact: "Débloque la possibilité future de créer des 'donjons spéciaux' personnalisés."
      },
      // Chapter 4
      {
        id: 'q17_ombre_passe', title: "L’Ombre du Passé", type: 'Combat', rankRequirement: 60,
        synopsis: "Le héros affronte une version d’ombre de lui-même dans une dimension miroir pour surmonter ses limites.",
        rewards: { artifact: { id: 13, name: "Echo of the Self", icon: '🎭', bonus: '+10% Army Attack', bonusValue: 0.1, bonusType: 'attack' }},
        narrativeImpact: "En acceptant votre part d'ombre, vous comprenez mieux votre propre destin.",
        gameplayImpact: "Améliore votre compétence ultime en augmentant la puissance de base de votre armée."
      },
      {
        id: 'q18_pacte_souverain', title: "Le Pacte du Souverain", type: 'Social', rankRequirement: 65,
        synopsis: "Un Souverain énigmatique vous propose une alliance, vous offrant un pouvoir immense en échange de votre loyauté. Le choix vous appartient.",
        rewards: { artifact: { id: 14, name: "Sovereign's Pact", icon: '📜', bonus: '+15% Mana Gain', bonusValue: 0.15, bonusType: 'mana' }},
        narrativeImpact: "Votre décision a des répercussions cosmiques, scellant votre allégeance dans la guerre à venir.",
        gameplayImpact: "Fournit un buff permanent à vos gains de ressources."
      },
      {
        id: 'q19_sept_ombres', title: "Les 7 Ombres", type: 'Combat', rankRequirement: 70,
        synopsis: "Sept ombres d'une puissance terrifiante, autrefois scellées, ont été libérées. Traquez-les et soumettez-les pour renforcer votre armée.",
        rewards: { artifact: { id: 15, name: "Seal of the Seven", icon: ' सात', bonus: '+10% Army HP', bonusValue: 0.1, bonusType: 'hp' }},
        narrativeImpact: "En battant ces ombres légendaires, vous prouvez votre statut de véritable Monarque des Ombres.",
        gameplayImpact: "Augmente considérablement la puissance et la résilience de votre armée."
      },
    ];

    const allQuests = questData.map(q => {
      let objectives: Omit<QuestObjective, 'progress' | 'isComplete'>[] = [];
      switch (q.id) {
        case 'q4_prix_du_pain':
          objectives = [ { id: 'defeat_racketteurs', description: 'Repousser les racketteurs', target: 3 } ];
          break;
        case 'q5_rat_du_donjon':
          objectives = [ { id: 'explore_sewers', description: 'Éliminer les créatures des égouts', target: 50 }, { id: 'close_rift', description: 'Fermer la faille instable', target: 1 }, ];
          break;
        case 'q6_frere_disparu':
          objectives = [ { id: 'reach_zone_20', description: 'Progresser pour trouver des indices', target: 20 }, { id: 'rescue_brother', description: 'Secourir le frère', target: 1 }, ];
          break;
        case 'q7_nettoyeur':
          objectives = [ { id: 'complete_dungeon', description: 'Terminer le nettoyage du donjon', target: 1 }, { id: 'extract_remains', description: "Extraire l'essence des ombres", target: 100 }, ];
          break;
        case 'q8_guilde_fantome':
          objectives = [ { id: 'reach_zone_30', description: 'Explorer le donjon jusqu\'au bout', target: 30 }, { id: 'defeat_monarch_shadow', description: 'Affronter le mini-Monarque', target: 1 }];
          break;
        case 'q9_contrat_jinho':
          objectives = [ { id: 'complete_xp_dungeon', description: 'Accompagner Jin-ho dans un donjon', target: 1 }];
          break;
        case 'q10_larmes_de_fer':
          objectives = [ { id: 'collect_ore', description: 'Collecter 10 minerais de fer', target: 100 }, { id: 'defeat_golem', description: 'Affronter un golem protecteur', target: 5 }];
          break;
        case 'q11_chasseuse_aveugle':
          objectives = [ { id: 'reach_zone_40', description: 'Trouver l\'origine de la malédiction', target: 40 }, { id: 'purify_source', description: 'Purifier la source de la malédiction', target: 1 }];
          break;
        case 'q12_marche_noir':
          objectives = [ { id: 'complete_elite_dungeon', description: 'Infiltrer le Marché Noir', target: 1 }];
          break;
        case 'q13_chant_dragon':
            objectives = [{ id: 'reach_zone_50', description: 'Explorer la grotte', target: 50 }, { id: 'defeat_juvenile_dragon', description: 'Affronter un dragon juvénile', target: 1 }];
            break;
        case 'q14_ombres_perdues':
            objectives = [{ id: 'find_lost_shadows', description: 'Retrouver les soldats corrompus', target: 250 }, { id: 'reach_zone_60', description: 'Comprendre la source de la corruption', target: 60 }];
            break;
        case 'q15_danse_lame':
            objectives = [{ id: 'complete_dragons_lair', description: 'Duel contre Cha Hae-in', target: 1 }];
            break;
        case 'q16_coeur_donjon':
            objectives = [
                { id: 'complete_gold_dungeon_puzzle', description: 'Résoudre le puzzle du mana', target: 1 },
                { id: 'complete_xp_dungeon_puzzle', description: 'Résoudre le puzzle de l\'expérience', target: 1 },
                { id: 'complete_elite_dungeon_puzzle', description: 'Résoudre le puzzle du combat', target: 1 },
                { id: 'reach_zone_70', description: 'Stabiliser le cœur', target: 70 },
                { id: 'defeat_dungeon_guardian', description: 'Affronter le gardien du cœur', target: 1 }
            ];
            break;
        case 'q17_ombre_passe':
            objectives = [
                { id: 'reach_zone_80', description: 'Explorer la dimension miroir', target: 80 },
                { id: 'defeat_dark_self', description: 'Affronter "Toi Sombre"', target: 1 }
            ];
            break;
        case 'q18_pacte_souverain':
            objectives = [
                { id: 'complete_dragons_lair_twice', description: 'Survivre à la conséquence', target: 2 }
            ];
            break;
        case 'q19_sept_ombres':
            objectives = [
                { id: 'defeat_7_shadows', description: 'Affronter les 7 ombres', target: 7 }
            ];
            break;
      }

      const questObjectives: QuestObjective[] = objectives.map(obj => {
        const progress = signal(0);
        const isComplete = computed(() => progress() >= obj.target);
        return { ...obj, progress, isComplete };
      });
      
      return {
        ...q,
        objectives: questObjectives,
        // FIX: Explicitly type the signal to match the Quest interface, preventing a type mismatch.
        status: signal<QuestStatus>(this.playerLevel() >= q.rankRequirement ? 'Available' : 'Locked')
      };
    });
    this.quests.set(allQuests);
  }

  private getMonarchUnit(name: string): Unit | null {
    const units: {[key: string]: Unit} = {
      'Shadow General': { name: 'Shadow General', icon: '👑', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 500, stats: { hp: '5M', attack: '150K', defense: '500K', speed: 'Medium' }, upgrades: [] },
      'Giant Wolf': { name: 'Giant Wolf', icon: '🐺', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 500, stats: { hp: '3M', attack: '450K', defense: '150K', speed: 'High' }, upgrades: [] },
      'Ice Golem': { name: 'Ice Golem', icon: '🧊', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 500, stats: { hp: '8M', attack: '100K', defense: '400K', speed: 'Low' }, upgrades: [] },
      'Chaos Knight': { name: 'Chaos Knight', icon: '💥', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 500, stats: { hp: '4M', attack: '400K', defense: '200K', speed: 'Medium' }, upgrades: [] },
      'Light Sentinel': { name: 'Light Sentinel', icon: '🌟', rank: 'SSS', level: 1, experience: 0, experienceToNextLevel: 500, stats: { hp: '10M', attack: '80K', defense: '350K', speed: 'Low' }, upgrades: [] },
    };
    return units[name] || null;
  }

  private getMonarchUltimate(name: string): PlayerSkill | null {
    const ultimates: {[key: string]: PlayerSkill} = {
      'March of Shadows': { name: 'March of Shadows', description: 'For 15s, your army damage is increased by 100%.', cooldown: 3600, onCooldown: false, cooldownTimer: 3600, action: () => this.showNotification('Ultimate: March of Shadows!') },
      'Primordial Roar': { name: 'Primordial Roar', description: 'Instantly deals 1000% of your total army attack as damage.', cooldown: 3600, onCooldown: false, cooldownTimer: 3600, action: () => this.showNotification('Ultimate: Primordial Roar!') },
      'Eternal Winter': { name: 'Eternal Winter', description: 'Freezes the current enemy for 10 seconds.', cooldown: 3600, onCooldown: false, cooldownTimer: 3600, action: () => this.showNotification('Ultimate: Eternal Winter!') },
      'Void Assault': { name: 'Void Assault', description: '+200% damage for 10s every 60s.', cooldown: 60, onCooldown: false, cooldownTimer: 60, action: () => this.showNotification('Ultimate: Void Assault!') },
      'Cataclysm': { name: 'Cataclysm', description: 'Sacrifice 20% of current army HP to deal massive damage.', cooldown: 3600, onCooldown: false, cooldownTimer: 3600, action: () => this.showNotification('Ultimate: Cataclysm!') },
      'Monarch\'s Crown': { name: 'Monarch\'s Crown', description: 'Grants +100% global stats for 30 seconds after defeating a boss.', cooldown: 3600, onCooldown: false, cooldownTimer: 3600, action: () => this.showNotification('Ultimate: Monarch\'s Crown!') },
    };
    return ultimates[name] || null;
  }

  startAutoCombat() {
    this.autoCombatInterval = setInterval(() => {
      this.progressWave();
    }, 2000);
  }

  progressWave(isRush: boolean = false) {
    this.checkZoneQuestProgress();
    let baseManaGained = 0; let xpGained = 0;
    if (this.isZoneBoss()) {
      baseManaGained = 2000 * this.currentZone(); xpGained = 1000 * this.currentZone();
      this.updateQuestProgress('close_rift', 1);
      this.updateQuestProgress('rescue_brother', 1);
      this.updateQuestProgress('defeat_monarch_shadow', 1);
      this.updateQuestProgress('purify_source', 1);
      this.updateQuestProgress('defeat_juvenile_dragon', 1);
      this.updateQuestProgress('defeat_dungeon_guardian', 1);
      this.updateQuestProgress('defeat_dark_self', 1);
      this.updateQuestProgress('defeat_7_shadows', 1);
    } else if (this.isFightingBoss()) {
      baseManaGained = 500 * this.currentZone(); xpGained = 250 * this.currentZone();
      this.updateQuestProgress('defeat_racketteurs', 1);
      this.updateQuestProgress('defeat_corrupted_knight', 1);
      this.updateQuestProgress('survive_waves', 1);
      this.updateQuestProgress('defeat_golem', 1);
    } else {
      baseManaGained = 100 * this.currentZone(); xpGained = 50 * this.currentZone();
      this.updateQuestProgress('explore_sewers', 1);
      this.updateQuestProgress('extract_remains', 1);
      this.updateQuestProgress('collect_ore', 1);
      this.updateQuestProgress('find_lost_shadows', 1);
      const shadowEchoQuest = this.quests().find(q => q.id === 'q1_shadow_echo' && q.status() === 'InProgress');
      if (shadowEchoQuest && this.currentZone() >= 50) {
        this.updateQuestProgress('defeat_corrupted', 1);
      }
    }

    const totalManaGained = Math.floor(baseManaGained * (1 + this.manaGainBonus() + this.permanentManaBonus()) * this.manaOverloadBonus());
    this.mana.update(m => m + totalManaGained);
    this.playerExperience.update(xp => xp + xpGained);
    this.armyUnits.update(units => {
      units.forEach(unit => {
        unit.experience += xpGained; this.levelUpUnitIfNeeded(unit);
      });
      return [...units];
    });
    this.levelUpPlayerIfNeeded();
    if (isRush) { this.showNotification(`Rushed wave ${this.currentWave()}!`); }
    this.currentWave.update(w => {
      if (w >= 10) { this.currentZone.update(z => z + 1); return 1; }
      return w + 1;
    });
  }

  clickForMana() {
    const manaPerClick = (10 * this.currentZone()) * this.clickManaBonus();
    this.mana.update(m => m + manaPerClick);
  }

  activateSkill(skill: PlayerSkill) {
    if (skill.onCooldown) return;
    skill.action(); skill.onCooldown = true; this.showNotification(`${skill.name} activated!`);
    const interval = setInterval(() => {
        skill.cooldownTimer--; this.skills.set([...this.skills()]);
        if (skill.cooldownTimer <= 0) {
            clearInterval(interval); skill.onCooldown = false; skill.cooldownTimer = skill.cooldown; this.skills.set([...this.skills()]);
        }
    }, 1000);
  }

  setView(view: View) {
    this.activeView.set(view);
    this.selectedUnit.set(null);
    this.selectedQuest.set(null);
  }

  selectUnit(unit: Unit) { this.selectedUnit.set(unit); }
  
  deselectUnit() { this.selectedUnit.set(null); }

  parseStat(statString: string): number {
    const lastChar = statString.slice(-1).toUpperCase();
    const numPart = parseFloat(statString);
    if (lastChar === 'K') return numPart * 1000;
    if (lastChar === 'M') return numPart * 1_000_000;
    if (lastChar === 'B') return numPart * 1_000_000_000;
    return numPart;
  }

  formatStat(statNumber: number): string {
    if (statNumber >= 1_000_000_000_000) return (statNumber / 1_000_000_000_000).toFixed(2) + 'T';
    if (statNumber >= 1_000_000_000) return (statNumber / 1_000_000_000).toFixed(2) + 'B';
    if (statNumber >= 1_000_000) return (statNumber / 1_000_000).toFixed(2) + 'M';
    if (statNumber >= 1000) return (statNumber / 1000).toFixed(1) + 'K';
    return statNumber.toString();
  }
  
  formatTime(seconds: number): string {
    if (seconds < 0) seconds = 0;
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    if (d > 0) return `${d}d ${h}:${m}:${s}`;
    return `${h}:${m}:${s}`;
  }

  upgradeUnit(unit: Unit, upgradeToApply: Upgrade) {
    if (upgradeToApply.purchased || this.mana() < upgradeToApply.cost || unit.level < upgradeToApply.levelRequirement) return;
    this.mana.update(m => m - upgradeToApply.cost);
    this.armyUnits.update(units => {
        const unitRef = units.find(u => u.name === unit.name);
        if (!unitRef) return units;
        const upgradeRef = unitRef.upgrades.find(upg => upg.name === upgradeToApply.name);
        if (!upgradeRef) return units;
        
        upgradeRef.purchased = true;
        
        const bonusStrings = upgradeRef.bonus.split('&').map(s => s.trim());

        for (const bonusString of bonusStrings) {
            const bonusParts = bonusString.split(' '); // e.g., ['+25%', 'HP']
            if (bonusParts.length < 2) continue;

            const percentage = parseFloat(bonusParts[0]) / 100;
            const statKey = bonusParts[1].toLowerCase() as keyof Unit['stats'];

            if (statKey in unitRef.stats) {
              const currentValue = this.parseStat(unitRef.stats[statKey]);
              const newValue = Math.floor(currentValue * (1 + percentage));
              unitRef.stats[statKey] = this.formatStat(newValue);
            }
        }
        
        this.selectedUnit.set({ ...unitRef });
        return [...units];
    });
  }

  levelUpPlayerIfNeeded() {
    while (this.playerExperience() >= this.playerExperienceToNextLevel()) {
      this.playerExperience.update(xp => xp - this.playerExperienceToNextLevel());
      this.playerLevel.update(l => l + 1);
      this.playerExperienceToNextLevel.update(xpnl => Math.floor(xpnl * 1.5));
      this.skillPoints.update(sp => sp + 1);
      this.showNotification(`You reached Level ${this.playerLevel()}!`);
      // Check for newly unlocked quests
      this.quests.update(quests => {
        quests.forEach(q => {
          if (q.status() === 'Locked' && this.playerLevel() >= q.rankRequirement) {
            q.status.set('Available');
            this.showNotification(`New Quest Available: ${q.title}`);
          }
        });
        return quests;
      });
    }
  }

  levelUpUnitIfNeeded(unit: Unit) {
    while (unit.experience >= unit.experienceToNextLevel) {
        unit.experience -= unit.experienceToNextLevel;
        unit.level++;
        unit.experienceToNextLevel = Math.floor(unit.experienceToNextLevel * 1.2);
        (Object.keys(unit.stats) as (keyof Unit['stats'])[]).forEach(statKey => {
            if (statKey !== 'speed') {
                const currentValue = this.parseStat(unit.stats[statKey]);
                const newValue = Math.floor(currentValue * 1.10);
                unit.stats[statKey] = this.formatStat(newValue);
            }
        });
    }
  }
  
  showNotification(message: string) {
    this.notification.set(message);
    setTimeout(() => this.notification.set(null), 3000);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  setSort(by: SortBy) {
    if (this.sortBy() === by) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(by);
      this.sortDirection.set(by === 'name' ? 'asc' : 'desc');
    }
  }

  purchaseSkill(skillToUpgrade: Skill) {
    if (this.skillPoints() > 0 && skillToUpgrade.level < skillToUpgrade.maxLevel) {
      this.skillPoints.update(sp => sp - 1);
      this.skillTrees.update(trees => {
        for (const tree of trees) {
          const skill = tree.skills.find(s => s.id === skillToUpgrade.id);
          if (skill) { skill.level++; break; }
        }
        return [...trees];
      });
    }
  }
  
  toggleArtifact(artifactToToggle: Artifact) {
    this.artifacts.update(artifacts => {
        const artifact = artifacts.find(a => a.id === artifactToToggle.id);
        if (!artifact) return artifacts;
        if (artifact.equipped) {
            artifact.equipped = false;
        } else {
            if (this.equippedArtifacts().length < this.maxEquippedArtifacts) {
                artifact.equipped = true;
            } else {
                this.showNotification(`Max artifacts equipped (${this.maxEquippedArtifacts})`);
            }
        }
        return [...artifacts];
    });
  }
  
  ascend() {
    if (!this.ascensionReady()) { this.showNotification("You are not ready to ascend yet."); return; }
    const essenceGained = this.ascensionEssenceGain();
    const pointsGained = this.ascensionPointsGain();
    this.showNotification(`Ascended! Gained ${essenceGained} Shadow Essence.`);
    this.ascensionCount.update(c => c + 1);
    this.shadowEssence.update(e => e + essenceGained);
    this.sovereignPoints.update(p => p + pointsGained);
    this.currentZone.set(1); this.currentWave.set(1); this.mana.set(1000);
    this.playerLevel.set(1); this.playerExperience.set(0); this.playerExperienceToNextLevel.set(250);
    this.skillPoints.set(0); this.skillTrees.set(getInitialSkillTrees());
    this.armyUnits.set(getInitialArmyUnits());
    this.setView('Dashboard');
  }
  
  startDungeon(dungeonToStart: Dungeon) {
    if (dungeonToStart.status !== 'Idle') return;
    this.dungeons.update(dungeons => {
        const dungeon = dungeons.find(d => d.id === dungeonToStart.id);
        if (dungeon) {
            dungeon.status = 'InProgress';
            dungeon.remainingTime.set(dungeon.duration);
            dungeon.timerInterval = setInterval(() => {
                dungeon.remainingTime.update(t => t - 1);
                if (dungeon.remainingTime() <= 0) {
                    clearInterval(dungeon.timerInterval);
                    dungeon.status = 'Completed';
                }
            }, 1000);
        }
        return [...dungeons];
    });
  }

  claimDungeonRewards(dungeonToClaim: Dungeon) {
      if (dungeonToClaim.status !== 'Completed') return;
      const { type, amount } = dungeonToClaim.rewards;
      let rewardMessage = '';
      if (type === 'mana') {
          this.mana.update(m => m + amount); rewardMessage = `Claimed ${this.formatStat(amount)} Mana!`;
      } else if (type === 'xp') {
          this.playerExperience.update(xp => xp + amount); this.levelUpPlayerIfNeeded(); rewardMessage = `Claimed ${this.formatStat(amount)} XP!`;
      } else if (type === 'gems') {
           this.gems.update(g => g + amount); rewardMessage = `Claimed ${this.formatStat(amount)} Gems!`;
      }
      this.showNotification(rewardMessage);

      // Quest progress update
      this.updateQuestProgress('complete_dungeon', 1);
      if (dungeonToClaim.id === 'gold') {
        this.updateQuestProgress('run_gold_dungeon', 1);
        this.updateQuestProgress('collect_shards', 1); // For simplicity, 1 run = 1 shard for quest
        this.updateQuestProgress('complete_gold_dungeon_puzzle', 1);
      }
      if (dungeonToClaim.id === 'xp') {
        this.updateQuestProgress('complete_xp_dungeon', 1);
        this.updateQuestProgress('complete_xp_dungeon_puzzle', 1);
      }
       if (dungeonToClaim.id === 'elite') {
        this.updateQuestProgress('complete_elite_dungeon', 1);
        this.updateQuestProgress('complete_elite_dungeon_puzzle', 1);
      }
      if (dungeonToClaim.id === 'dragon') {
        this.updateQuestProgress('complete_dragons_lair', 1);
        this.updateQuestProgress('complete_dragons_lair_twice', 1);
      }

      this.dungeons.update(dungeons => {
          const dungeon = dungeons.find(d => d.id === dungeonToClaim.id);
          if (dungeon) {
              dungeon.status = 'Idle'; dungeon.remainingTime.set(dungeon.duration);
          }
          return [...dungeons];
      });
  }

  toggleRaidParticipation() {
    this.isRaiding.update(raiding => !raiding);
    if(this.isRaiding()) {
        this.raidDamageInterval = setInterval(() => {
            const boss = this.raidBoss();
            if (!boss || boss.status !== 'InProgress') {
                this.isRaiding.set(false);
                clearInterval(this.raidDamageInterval);
                return;
            }
            
            const damagePerSecond = this.totalArmyAttack();
            boss.currentHp.update(hp => Math.max(0, hp - damagePerSecond));
            
            this.raidLeaderboard.update(board => {
                const playerEntry = board.find(e => e.isPlayer);
                if(playerEntry) playerEntry.damageDealt.update(d => d + damagePerSecond);
                board.sort((a,b) => b.damageDealt() - a.damageDealt());
                board.forEach((entry, index) => entry.rank = index + 1);
                return [...board];
            });

            const hpPercent = boss.currentHp() / boss.totalHp;
            if (hpPercent < 0.33 && boss.currentPhase() !== 3) {
                boss.currentPhase.set(3); this.showNotification(`${boss.name} has entered Phase 3!`);
            } else if (hpPercent < 0.66 && boss.currentPhase() !== 2) {
                boss.currentPhase.set(2); this.showNotification(`${boss.name} has entered Phase 2!`);
            }
            
            if (boss.currentHp() <= 0) {
                boss.status = 'Defeated'; this.isRaiding.set(false); this.showNotification(`${boss.name} has been defeated!`);
                this.updateQuestProgress('defeat_gatekeeper', 1);
            }
        }, 1000);
    } else {
        clearInterval(this.raidDamageInterval);
    }
  }

  claimRaidRewards() {
    const boss = this.raidBoss();
    if (!boss || boss.status === 'InProgress' || this.hasClaimedRaidRewards()) return;
    const rank = this.playerRaidRank();
    let essenceReward = 0; let gemsReward = 0;
    if (rank === 1) { essenceReward = 50000; gemsReward = 5000;
    } else if (rank <= 3) { essenceReward = 25000; gemsReward = 2500;
    } else if (rank <= 5) { essenceReward = 10000; gemsReward = 1000;
    } else { essenceReward = 5000; gemsReward = 500; }
    this.shadowEssence.update(e => e + essenceReward);
    this.gems.update(g => g + gemsReward);
    this.hasClaimedRaidRewards.set(true);
    this.showNotification(`Claimed Rank ${rank} rewards: ${this.formatStat(essenceReward)} Essence and ${this.formatStat(gemsReward)} Gems!`);
  }

  selectMonarch(monarchId: MonarchType) {
    if (this.chosenMonarch() || !this.isMonarchSystemUnlocked()) return;

    const monarchData = this.monarchs.find(m => m.id === monarchId);
    if (!monarchData) return;

    this.chosenMonarch.set(monarchId);
    this.showNotification(`You have sworn allegiance to the ${monarchData.name}!`);

    const uniqueUnit = this.getMonarchUnit(monarchData.uniqueUnitName);
    if(uniqueUnit && !this.armyUnits().find(u => u.name === uniqueUnit.name)) {
        this.armyUnits.update(units => [...units, uniqueUnit]);
    }

    const ultimate = this.getMonarchUltimate(monarchData.ultimateName);
    if(ultimate && !this.skills().find(s => s.name === ultimate.name)) {
        this.skills.update(skills => [...skills, ultimate]);
    }
  }

  isMonarchTierUnlocked(tier: number, monarch: Monarch): boolean {
    if (tier === 1) return true;
    return monarch.skillTree.some(s => s.tier === tier - 1 && s.level > 0);
  }

  purchaseMonarchSkill(skillToUpgrade: MonarchSkill) {
    const monarch = this.activeMonarch();
    if (!monarch) return;
    
    if (this.sovereignPoints() >= skillToUpgrade.cost && 
        skillToUpgrade.level < skillToUpgrade.maxLevel &&
        this.isMonarchTierUnlocked(skillToUpgrade.tier, monarch)) {
        
      this.sovereignPoints.update(sp => sp - skillToUpgrade.cost);
      
      const skill = monarch.skillTree.find(s => s.id === skillToUpgrade.id);
      if (skill) {
        skill.level++;
      }
      this.monarchs = [...this.monarchs];
    }
  }

  // Quest Methods
  startQuest(questToStart: Quest) {
    if (questToStart.status() !== 'Available') return;
    questToStart.status.set('InProgress');
    this.showNotification(`Quest Started: ${questToStart.title}`);
    this.selectedQuest.set(questToStart);
  }

  claimQuestRewards(questToClaim: Quest) {
    if (questToClaim.status() !== 'Completed') return;
    const { rewards } = questToClaim;
    let rewardText = 'Rewards: ';
    if (rewards.mana) { this.mana.update(m => m + rewards.mana!); rewardText += `${this.formatStat(rewards.mana)} Mana, `; }
    if (rewards.gems) { this.gems.update(g => g + rewards.gems!); rewardText += `${rewards.gems} Gems, `; }
    if (rewards.shadowEssence) { this.shadowEssence.update(e => e + rewards.shadowEssence!); rewardText += `${rewards.shadowEssence} Essence, `; }
    if (rewards.items) {
      rewards.items.forEach(rewardItem => {
        this.inventoryItems.update(items => {
          const item = items.find(i => i.id === rewardItem.id);
          if (item) { item.quantity += rewardItem.quantity; } else { /* handle new item if needed */ }
          return [...items];
        });
        const itemName = this.getItemName(rewardItem.id);
        rewardText += `${rewardItem.quantity}x ${itemName}, `;
      });
    }
    if (rewards.artifact) {
      this.artifacts.update(artifacts => [...artifacts, { ...rewards.artifact!, equipped: false }]);
      rewardText += `${rewards.artifact.name}, `;
    }
    if (rewards.skill) {
      const newSkill: PlayerSkill = { ...rewards.skill, onCooldown: false, cooldownTimer: rewards.skill.cooldown };
      this.skills.update(skills => [...skills, newSkill]);
      rewardText += `New Skill: ${rewards.skill.name}, `;
    }

    questToClaim.status.set('Claimed');
    this.showNotification(`Quest Claimed! ${rewardText.slice(0, -2)}`);
    this.selectedQuest.set(questToClaim);
  }

  getItemName(id: number): string {
    const item = this.inventoryItems().find(i => i.id === id);
    return item ? item.name : 'Unknown Item';
  }
  
  refineQuestShards(quest: Quest) {
    const objective = quest.objectives.find(o => o.id === 'refine_shards');
    if (!objective || this.mana() < objective.target) {
        this.showNotification("Not enough Mana to refine shards!");
        return;
    }
    this.mana.update(m => m - objective.target);
    // Directly set progress to target, as this is a one-off action
    objective.progress.set(objective.target);
    this.showNotification("Crystal shards refined!");
    this.checkQuestCompletion(quest);
  }

  checkZoneQuestProgress() {
    for (const quest of this.inProgressQuests()) {
        for (const obj of quest.objectives) {
            if (obj.id.startsWith('reach_zone')) {
                obj.progress.set(Math.min(this.currentZone(), obj.target));
            }
        }
        this.checkQuestCompletion(quest);
    }
  }

  updateQuestProgress(objectiveId: string, amount: number) {
    for (const quest of this.inProgressQuests()) {
      for (const obj of quest.objectives) {
        if (obj.id === objectiveId) {
          obj.progress.update(p => Math.min(p + amount, obj.target));
        }
      }
      this.checkQuestCompletion(quest);
    }
  }

  private checkQuestCompletion(quest: Quest) {
     if (quest.status() === 'InProgress' && quest.objectives.every(o => o.isComplete())) {
        quest.status.set('Completed');
        this.showNotification(`Quest Complete: ${quest.title}`);
      }
  }

  // == Procedural Dungeon Methods ==
  
  private BIOME_CONFIG: Record<BiomeType, { name: string; icon: string; description: string; enemyPool: string[]; eventPool: string[]; boss: string; }> = {
    'Shadow Crypt': {
      name: 'Shadow Crypt', icon: '💀', description: 'A dark, eerie place filled with the restless dead.',
      enemyPool: ['Skeletal Soldiers', 'Ghouls', 'Wraiths'], eventPool: ['tomb', 'shadow_altar'], boss: 'Lich Lord'
    },
    'Frost Cave': {
      name: 'Frost Cave', icon: '❄️', description: 'A cavern of eternal ice, home to frigid beasts.',
      enemyPool: ['Ice Sprites', 'Frost Wolves', 'Yetis'], eventPool: ['frozen_fountain', 'ice_script'], boss: 'Ancient Ice Golem'
    }
  };

  initializeDungeonEvents() {
    this.dungeonEvents = [
      { id: 'tomb', description: 'You find the tomb of a forgotten knight. The air is heavy with dormant power.',
        options: [
          { text: 'Pry it open', action: () => {
              if (Math.random() > 0.4) {
                return { outcomeText: 'The tomb grants you its power! You find a trove of mana.', rewards: { mana: 5000 * this.currentZone() }, staminaChange: 0 };
              }
              return { outcomeText: 'A curse strikes you! Your energy is drained.', staminaChange: -5 };
          }},
          { text: 'Leave it', action: () => ({ outcomeText: 'You respectfully leave the tomb untouched.' }) }
        ]
      },
      { id: 'shadow_altar', description: 'A dark altar pulses with faint energy. It seems to demand a sacrifice.',
        options: [
          { text: 'Offer Mana', action: () => {
              this.mana.update(m => m - (1000 * this.currentZone()));
              return { outcomeText: 'The altar accepts your offering, restoring some of your stamina.', staminaChange: 10 };
          }},
          { text: 'Destroy it', action: () => {
            if (Math.random() > 0.6) {
              return { outcomeText: 'The altar shatters, releasing a burst of gems!', rewards: { gems: 100 + this.currentZone() }};
            }
            return { outcomeText: 'The altar lashes out as it breaks, draining you.', staminaChange: -8 };
          }}
        ]
      },
      { id: 'frozen_fountain', description: 'You discover a fountain, frozen solid, with a glowing gem at its center.',
        options: [
          { text: 'Thaw it carefully', action: () => {
            return { outcomeText: 'Your efforts restore the fountain, and it revitalizes you.', staminaChange: 15 };
          }},
          { text: 'Smash the ice', action: () => {
             return { outcomeText: 'You retrieve the gem!', rewards: { gems: 250 + this.currentZone() } };
          }}
        ]
      },
      { id: 'ice_script', description: 'Ancient runes are carved into a wall of ice. They are difficult to read.',
        options: [
          { text: 'Spend time deciphering', action: () => {
            return { outcomeText: 'The runes tell of a hidden stash of mana nearby!', staminaChange: -2, rewards: { mana: 8000 * this.currentZone() } };
          }},
          { text: 'Ignore them', action: () => {
            return { outcomeText: 'You press on, ignoring the cryptic message.' };
          }}
        ]
      }
    ];
  }
  
  generateDungeon(biome: BiomeType, depth: number) {
    const config = this.BIOME_CONFIG[biome];
    const floors: DungeonFloor[] = [];
    
    for (let i = 0; i < depth; i++) {
        let floor: DungeonFloor;
        const difficultyModifier = 1 + (i / 10);

        if (i === depth - 1) { // Last floor is always the boss
            floor = { type: 'Boss', difficultyModifier, isCleared: false, encounterText: `The air grows heavy. The dungeon's master, the ${config.boss}, awaits!` };
        } else {
            const roll = Math.random();
            if (roll < 0.1) { // 10% chance for treasure
                floor = { type: 'Treasure', difficultyModifier, isCleared: false, encounterText: 'A glimmer of light reveals a hidden treasure trove!' };
            } else if (roll < 0.3) { // 20% chance for event (10% + 20% = 30%)
                const eventId = config.eventPool[Math.floor(Math.random() * config.eventPool.length)];
                const eventTemplate = this.dungeonEvents.find(e => e.id === eventId)!;
                floor = { type: 'Event', difficultyModifier, event: eventTemplate, isCleared: false, encounterText: eventTemplate.description };
            } else { // 70% chance for combat
                const enemy = config.enemyPool[Math.floor(Math.random() * config.enemyPool.length)];
                floor = { type: 'Combat', difficultyModifier, isCleared: false, encounterText: `You encounter a group of hostile ${enemy}.` };
            }
        }
        floors.push(floor);
    }
    
    const stamina = depth * 2;
    const newDungeon: GeneratedDungeon = {
        id: `dungeon_${Date.now()}`,
        name: `${biome} (Depth ${depth})`,
        biome,
        floors,
        currentFloor: 0,
        depth,
        stamina,
        maxStamina: stamina,
        status: floors[0].type === 'Event' ? 'Event' : 'Exploring',
        accumulatedRewards: { mana: 0, gems: 0 },
        lastEventResult: signal(null),
    };

    this.activeGeneratedDungeon.set(newDungeon);
    this.proceduralDungeonsView.set('Exploring');
  }

  progressDungeonFloor() {
    const dungeon = this.activeGeneratedDungeon();
    if (!dungeon) return;

    // Calculate rewards for the floor we are LEAVING
    const floor = dungeon.floors[dungeon.currentFloor];
    let floorManaReward = 0;
    let floorGemsReward = 0;

    switch (floor.type) {
        case 'Combat':
            floorManaReward = Math.floor((50 * this.currentZone() * floor.difficultyModifier) * (1 + this.manaGainBonus()));
            break;
        case 'Treasure':
            floorManaReward = Math.floor((250 * this.currentZone() * floor.difficultyModifier) * (1 + this.manaGainBonus()));
            floorGemsReward = Math.floor(25 * floor.difficultyModifier);
            break;
        case 'Boss':
            floorManaReward = Math.floor((1000 * this.currentZone() * floor.difficultyModifier) * (1 + this.manaGainBonus()));
            floorGemsReward = Math.floor(100 * floor.difficultyModifier);
            break;
    }
    dungeon.accumulatedRewards.mana += floorManaReward;
    dungeon.accumulatedRewards.gems += floorGemsReward;
    
    floor.isCleared = true;
    dungeon.stamina--;

    // Check for failure
    if (dungeon.stamina <= 0) {
        this.handleDungeonFailure();
        return;
    }

    // Check for completion
    if (dungeon.currentFloor >= dungeon.depth - 1) {
        this.completeDungeonRun(true);
        return;
    }

    // Move to next floor
    dungeon.currentFloor++;
    const nextFloor = dungeon.floors[dungeon.currentFloor];
    dungeon.status = nextFloor.type === 'Event' ? 'Event' : 'Exploring';
    
    dungeon.lastEventResult.set(null); // Clear previous event result
    this.activeGeneratedDungeon.set({ ...dungeon }); // Trigger signal update
  }

  resolveDungeonEvent(option: DungeonEventOption) {
    const dungeon = this.activeGeneratedDungeon();
    if (!dungeon || dungeon.status !== 'Event') return;
    
    const result = option.action();
    
    dungeon.stamina += result.staminaChange || 0;
    dungeon.accumulatedRewards.mana += result.rewards?.mana || 0;
    dungeon.accumulatedRewards.gems += result.rewards?.gems || 0;
    
    if (dungeon.stamina <= 0) {
      this.handleDungeonFailure();
      return;
    }

    dungeon.status = 'Exploring'; // Allow progression
    dungeon.lastEventResult.set(result);
    this.activeGeneratedDungeon.set({ ...dungeon });
  }

  escapeDungeon() {
    this.completeDungeonRun(true);
  }

  private handleDungeonFailure() {
    const dungeon = this.activeGeneratedDungeon();
    if (!dungeon) return;
    
    // Lose 50% of rewards on failure
    dungeon.accumulatedRewards.mana = Math.floor(dungeon.accumulatedRewards.mana * 0.5);
    dungeon.accumulatedRewards.gems = Math.floor(dungeon.accumulatedRewards.gems * 0.5);
    
    this.completeDungeonRun(false);
  }

  private completeDungeonRun(success: boolean) {
    const dungeon = this.activeGeneratedDungeon();
    if (!dungeon) return;

    this.mana.update(m => m + dungeon.accumulatedRewards.mana);
    this.gems.update(g => g + dungeon.accumulatedRewards.gems);
    
    this.dungeonRunResult.set({
        status: success ? 'Completed' : 'Failed',
        rewards: dungeon.accumulatedRewards
    });

    this.activeGeneratedDungeon.set(null);
    this.proceduralDungeonsView.set('Results');
  }

}
