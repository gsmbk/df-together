export type SessionTime = {
  id: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  timeZoneAbbreviation: string;
  location: string;
  seating: string;
  actionLabel: string;
  startAt: string;
  endAt: string;
};

export type DreamforceSession = {
  id: string;
  title: string;
  abstract: string;
  officialUrl: string;
  formats: string[];
  products: string[];
  roles: string[];
  industries: string[];
  topics: string[];
  levels: string[];
  locations: string[];
  days: string[];
  requiredEquipment: string[];
  objectives: string[];
  community: string[];
  viewingOptions: string[];
  catalogBadges: string[];
  /** Speaker names, when the importer captured them. */
  speakers?: string[];
  times: SessionTime[];
};

export type Catalog = {
  metadata: {
    event: string;
    eventCode: string;
    sourceUrl: string;
    importedAt: string;
    timeZone: string;
    sessionCount: number;
    sessionTimeCount: number;
    disclaimer: string;
  };
  sessions: DreamforceSession[];
};

export type AgendaSelection = {
  sessionId: string;
  sessionTimeId: string;
};

/** A selection resolved against the catalog. */
export type ResolvedAgendaItem = {
  session: DreamforceSession;
  time: SessionTime;
};

export type FilterKey =
  | 'formats'
  | 'products'
  | 'roles'
  | 'industries'
  | 'topics'
  | 'levels'
  | 'locations'
  | 'requiredEquipment'
  | 'community'
  | 'viewingOptions'
  | 'days';

export type CatalogFilters = Record<FilterKey, string[]>;

export type FriendProfile = {
  id: string;
  display_name: string;
  avatar_color: string;
  share_agenda_with_friends: boolean;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

export type SocialSnapshot = {
  friends: Array<{ friendship: Friendship; profile: FriendProfile }>;
  incoming: Array<{ friendship: Friendship; profile: FriendProfile }>;
  outgoing: Array<{ friendship: Friendship; profile: FriendProfile }>;
};

export type SessionNote = {
  sessionId: string;
  note: string;
  /** 0 means unrated, otherwise 1–5. */
  rating: number;
  updatedAt: string;
};

export type Interests = {
  products: string[];
  roles: string[];
};
