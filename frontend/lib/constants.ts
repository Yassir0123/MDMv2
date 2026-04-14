export interface User {
  id: string
  name: string
  email: string
  password: string
  department: string
  chief?: string
  /**
   * Rôle fonctionnel de l'utilisateur dans l'application.
   * On accepte ici tous les libellés utilisés dans les écrans :
   * - "Agent"
   * - "Administrateur"
   * - "Manager"
   * - "Gestionnaire"
   */
  role: "Agent" | "Administrateur" | "Manager" | "Gestionnaire"
  dateJoining: string
  agentType?: "agent" | "manager"
  agency?: string
  cin?: string
  matricule?: string
  status: "Attached" | "Detached" | "Deactivated" | "Activated"
  deactivationReason?: string
  deactivationDate?: string
  manager?: string
  /** Indique si l'utilisateur est chef / gestionnaire dans son département. */
  isChief?: boolean
  /** Spécialisation du gestionnaire (ex: administrateur, chef d'agence). */
  gestionnaireType?: "administrateur" | "chef-agence"
  subordinates?: string[]
}

export interface UserHistory {
  id: string
  userId: string
  userName: string
  userPrenom?: string
  cin?: string
  matricule?: string
  actionType: "Detached" | "Reattached" | "Deactivated" | "Reactivated"
  oldDepartment?: string
  newDepartment?: string
  oldChief?: string
  newChief?: string
  date: string
  timestamp: string
}

export interface Sim {
  id: string
  number: string
  provider: string
  status: "Active" | "Inactive"
  type: "Sim"
  assignedTo?: string
  dateAssigned?: string
  pin?: string
  puk?: string
}

export interface InternetLine {
  id: string
  number: string
  provider: string
  /** Statut de la ligne : active, inactive ou résiliée. */
  status: "Active" | "Inactive" | "Resigned"
  type: "Internet"
  speed?: string
  assignedTo?: string
  dateAssigned?: string
}

export interface MobileDevice {
  id: string
  name: string
  serialNumber: string
  imei: string
  type: "PDA" | "GSM" | "TSP"
  brand: string
  model: string
  status: "Available" | "Assigned"
  assignedTo?: string
  dateAssigned?: string
}

export interface Affectation {
  id: string
  targetId: string
  targetType: "user" | "service"
  targetName: string
  assetType: "sim" | "internet" | "mobile"
  assetId: string
  assetName: string
  action: "Affecté" | "Reçu" | "Supprimé"
  date: string
  timestamp: string
}

export interface Department {
  id: string
  name: string
  chief: string
  memberCount: number
  status: "Active" | "Inactive"
  createdDate: string
}

export interface Agence {
  id: string
  name: string
  address: string
  city: string
  phone: string
  chefAgence: string
  departmentCount: number
  status: "Active" | "Inactive"
  createdDate: string
}

export const FAKE_USERS: User[] = [
  {
    id: "U001",
    name: "Jean Dupont",
    email: "jean.dupont@mdm.com",
    password: "123",
    department: "Logistique",
    chief: "Marie Bernard",
    role: "Agent",
    agentType: "agent",
    dateJoining: "2023-01-15",
    cin: "AB123456",
    matricule: "MAT001",
    status: "Attached",
    subordinates: ["U003", "U004", "U007", "U011", "U012"],
  },
  {
    id: "U002",
    name: "Marie Bernard",
    email: "marie.bernard@mdm.com",
    password: "123",
    department: "Opérations",
    role: "Administrateur",
    //gestionnaireType: "administrateur",
    dateJoining: "2022-06-10",
    cin: "AB654321",
    matricule: "MAT002",
    status: "Activated",
    subordinates: ["U004", "U006", "U008"],
  },
  {
    id: "U018",
    name: "Jean-Pierre Martin",
    email: "jean-pierre.martin@mdm.com",
    password: "password123",
    department: "Administration",
    role: "Administrateur",
    //gestionnaireType: "administrateur",
    dateJoining: "2021-01-15",
    cin: "XY123456",
    matricule: "MAT018",
    status: "Activated",
  },
  {
    id: "U003",
    name: "Pierre Moreau",
    email: "pierre.moreau@mdm.com",
    password: "password123",
    department: "Logistique",
    chief: "Jean Dupont",
    role: "Agent",
    dateJoining: "2023-03-20",
    cin: "AB789012",
    matricule: "MAT003",
    status: "Activated",
  },
  {
    id: "U004",
    name: "Sophie Laurent",
    email: "sophie.laurent@mdm.com",
    password: "password123",
    department: "Administration",
    chief: "Marie Bernard",
    role: "Agent",
    dateJoining: "2021-11-05",
    cin: "AB345678",
    matricule: "MAT004",
    status: "Activated",
  },
  {
    id: "U005",
    name: "Thomas Michel",
    email: "thomas.michel@mdm.com",
    password: "password123",
    department: "Maintenance",
    role: "Agent",
    dateJoining: "2023-07-01",
    cin: "AB901234",
    matricule: "MAT005",
    status: "Deactivated",
    deactivationReason: "Démission",
    deactivationDate: "2024-06-15",
  },
  {
    id: "U006",
    name: "Isabelle Dubois",
    email: "isabelle.dubois@mdm.com",
    password: "password123",
    department: "Administration",
    chief: "Marie Bernard",
    role: "Agent",
    dateJoining: "2023-02-14",
    cin: "AB567890",
    matricule: "MAT006",
    status: "Attached",
  },
  {
    id: "U007",
    name: "Luc Martin",
    email: "luc.martin@mdm.com",
    password: "password123",
    department: "IT",
    chief: "Jean Dupont",
    role: "Agent",
    dateJoining: "2022-09-03",
    cin: "AB234567",
    matricule: "MAT007",
    status: "Attached",
  },
  {
    id: "U008",
    name: "Céline Rousseau",
    email: "celine.rousseau@mdm.com",
    password: "password123",
    department: "Ressources Humaines",
    role: "Agent",
    dateJoining: "2022-04-12",
    cin: "AB345679",
    matricule: "MAT008",
    status: "Attached",
  },
  {
    id: "U009",
    name: "Marc Fontaine",
    email: "marc.fontaine@mdm.com",
    password: "password123",
    department: "Ventes",
    role: "Agent",
    dateJoining: "2023-05-08",
    cin: "AB456780",
    matricule: "MAT009",
    status: "Deactivated",
    deactivationReason: "Retraite",
    deactivationDate: "2024-05-01",
  },
  {
    id: "U010",
    name: "Nathalie Gauthier",
    email: "nathalie.gauthier@mdm.com",
    password: "password123",
    department: "Support",
    role: "Agent",
    dateJoining: "2023-08-15",
    cin: "AB567891",
    matricule: "MAT010",
    status: "Attached",
  },
  {
    id: "U011",
    name: "Denis Leclerc",
    email: "denis.leclerc@mdm.com",
    password: "password123",
    department: "Production",
    chief: "Jean Dupont",
    role: "Agent",
    dateJoining: "2021-10-20",
    cin: "AB678901",
    matricule: "MAT011",
    status: "Attached",
  },
  {
    id: "U012",
    name: "Véronique Petit",
    email: "veronique.petit@mdm.com",
    password: "password123",
    department: "Qualité",
    chief: "Jean Dupont",
    role: "Agent",
    dateJoining: "2022-12-01",
    cin: "AB789013",
    matricule: "MAT012",
    status: "Detached",
  },
  {
    id: "U013",
    name: "Nicolas Bernard",
    email: "nicolas.bernard@mdm.com",
    password: "password123",
    department: "IT",
    role: "Agent",
    dateJoining: "2022-03-10",
    cin: "AB890123",
    matricule: "MAT013",
    status: "Deactivated",
    deactivationReason: "Changement de poste",
    deactivationDate: "2024-03-20",
  },
  {
    id: "U014",
    name: "Sandrine Dupré",
    email: "sandrine.dupre@mdm.com",
    password: "password123",
    department: "Logistique",
    role: "Agent",
    dateJoining: "2021-07-15",
    cin: "AB901235",
    matricule: "MAT014",
    status: "Detached",
  },
  {
    id: "U015",
    name: "André Blanc",
    email: "andre.blanc@mdm.com",
    password: "password123",
    department: "Production",
    role: "Agent",
    dateJoining: "2020-11-20",
    cin: "AB012345",
    matricule: "MAT015",
    status: "Deactivated",
    deactivationReason: "Retraite",
    deactivationDate: "2024-01-10",
  },
  {
    id: "U016",
    name: "Laurent Dupuis",
    email: "laurent.dupuis@mdm.com",
    password: "password123",
    department: "Agence Nord",
    role: "Administrateur",
    //gestionnaireType: "Chef d'Agence",
    dateJoining: "2021-01-10",
    cin: "AB123457",
    matricule: "MAT016",
    status: "Activated",
    agency: "Agence Nord",
    subordinates: ["U001", "U003", "U007"],
  },
  {
    id: "U017",
    name: "Admin User",
    email: "admin@mdm.com",
    password: "password123",
    department: "Administration",
    role: "Administrateur",
    //gestionnaireType: "Administrateur",
    dateJoining: "2020-06-01",
    cin: "AB234568",
    matricule: "MAT017",
    status: "Activated",
  },
]

export const FAKE_USER_HISTORY: UserHistory[] = [
  {
    id: "UH001",
    userId: "U012",
    userName: "Petit",
    userPrenom: "Véronique",
    cin: "AB789013",
    matricule: "MAT012",
    actionType: "Detached",
    oldDepartment: "Qualité",
    oldChief: "Jean Dupont",
    newDepartment: undefined,
    newChief: undefined,
    date: "2024-08-10",
    timestamp: "2024-08-10 14:30",
  },
  {
    id: "UH002",
    userId: "U014",
    userName: "Dupré",
    userPrenom: "Sandrine",
    cin: "AB901235",
    matricule: "MAT014",
    actionType: "Detached",
    oldDepartment: "Logistique",
    oldChief: "Jean Dupont",
    newDepartment: undefined,
    newChief: undefined,
    date: "2024-07-15",
    timestamp: "2024-07-15 10:00",
  },
  {
    id: "UH003",
    userId: "U005",
    userName: "Michel",
    userPrenom: "Thomas",
    cin: "AB901234",
    matricule: "MAT005",
    actionType: "Deactivated",
    date: "2024-06-15",
    timestamp: "2024-06-15 09:15",
  },
]

export const FAKE_SIMS: Sim[] = [
  {
    id: "SIM001",
    number: "+33612345601",
    provider: "Orange",
    status: "Active",
    type: "Sim",
    pin: "1234",
    puk: "12345678",
  },
  {
    id: "SIM002",
    number: "+33612345602",
    provider: "SFR",
    status: "Active",
    type: "Sim",
    pin: "5678",
    puk: "87654321",
  },
  {
    id: "SIM003",
    number: "+33612345603",
    provider: "Bouygues",
    status: "Active",
    type: "Sim",
    pin: "9012",
    puk: "34567890",
  },
  { id: "SIM004", number: "+33612345604", provider: "Orange", status: "Inactive", type: "Sim" },
  {
    id: "SIM005",
    number: "+33612345605",
    provider: "SFR",
    status: "Active",
    type: "Sim",
    pin: "1111",
    puk: "11111111",
  },
  {
    id: "SIM006",
    number: "+33612345606",
    provider: "Bouygues",
    status: "Active",
    type: "Sim",
    pin: "2222",
    puk: "22222222",
  },
  {
    id: "SIM007",
    number: "+33612345607",
    provider: "Orange",
    status: "Active",
    type: "Sim",
    pin: "3333",
    puk: "33333333",
  },
  { id: "SIM008", number: "+33612345608", provider: "SFR", status: "Inactive", type: "Sim" },
  {
    id: "SIM009",
    number: "+33612345609",
    provider: "Bouygues",
    status: "Active",
    type: "Sim",
    pin: "4444",
    puk: "44444444",
  },
  {
    id: "SIM010",
    number: "+33612345610",
    provider: "Orange",
    status: "Active",
    type: "Sim",
    pin: "5555",
    puk: "55555555",
  },
]

export const FAKE_INTERNET_LINES: InternetLine[] = [
  {
    id: "INT001",
    number: "LIG-ORG-001",
    provider: "Orange Entreprise",
    status: "Active",
    type: "Internet",
    speed: "100 Mbps",
  },
  {
    id: "INT002",
    number: "LIG-SFR-001",
    provider: "SFR Entreprise",
    status: "Active",
    type: "Internet",
    speed: "50 Mbps",
  },
  {
    id: "INT003",
    number: "LIG-BOY-001",
    provider: "Bouygues Entreprise",
    status: "Active",
    type: "Internet",
    speed: "200 Mbps",
  },
  {
    id: "INT004",
    number: "LIG-ORG-002",
    provider: "Orange Entreprise",
    status: "Inactive",
    type: "Internet",
    speed: "100 Mbps",
  },
  {
    id: "INT005",
    number: "LIG-SFR-002",
    provider: "SFR Entreprise",
    status: "Active",
    type: "Internet",
    speed: "100 Mbps",
  },
  {
    id: "INT006",
    number: "LIG-BOY-002",
    provider: "Bouygues Entreprise",
    status: "Active",
    type: "Internet",
    speed: "150 Mbps",
  },
  {
    id: "INT007",
    number: "LIG-ORG-003",
    provider: "Orange Entreprise",
    status: "Active",
    type: "Internet",
    speed: "500 Mbps",
  },
  {
    id: "INT008",
    number: "LIG-SFR-003",
    provider: "SFR Entreprise",
    status: "Active",
    type: "Internet",
    speed: "75 Mbps",
  },
]

export const FAKE_MOBILE_DEVICES: MobileDevice[] = [
  {
    id: "MOB001",
    name: "Samsung Galaxy S21",
    serialNumber: "RF9K10ACRPH",
    imei: "359072082474611",
    type: "GSM",
    brand: "Samsung",
    model: "Galaxy S21",
    status: "Assigned",
    assignedTo: "U005",
    dateAssigned: "2024-01-15",
  },
  {
    id: "MOB002",
    name: "Apple iPhone 14",
    serialNumber: "F9K7K1N0MD82",
    imei: "356938035643809",
    type: "GSM",
    brand: "Apple",
    model: "iPhone 14",
    status: "Available",
    dateAssigned: undefined,
  },
  {
    id: "MOB003",
    name: "Honeywell CT50",
    serialNumber: "0123456789AB",
    imei: "351336080021137",
    type: "PDA",
    brand: "Honeywell",
    model: "CT50",
    status: "Assigned",
    assignedTo: "U003",
    dateAssigned: "2024-02-01",
  },
  {
    id: "MOB004",
    name: "Zebra MC9300",
    serialNumber: "6B01234567",
    imei: "351336080156278",
    type: "PDA",
    brand: "Zebra",
    model: "MC9300",
    status: "Assigned",
    assignedTo: "U006",
    dateAssigned: "2024-01-20",
  },
  {
    id: "MOB005",
    name: "Motorola Moto G",
    serialNumber: "ZY2231LN39",
    imei: "351336080156500",
    type: "GSM",
    brand: "Motorola",
    model: "Moto G",
    status: "Available",
  },
  {
    id: "MOB006",
    name: "Datalogic Falcon",
    serialNumber: "0147852369",
    imei: "351336080156600",
    type: "PDA",
    brand: "Datalogic",
    model: "Falcon X4",
    status: "Assigned",
    assignedTo: "U004",
    dateAssigned: "2024-01-10",
  },
  {
    id: "MOB007",
    name: "Samsung Galaxy Tablet",
    serialNumber: "RF9K10ACRXX",
    imei: "351336080156700",
    type: "TSP",
    brand: "Samsung",
    model: "Galaxy Tab S7",
    status: "Assigned",
    assignedTo: "U007",
    dateAssigned: "2024-02-10",
  },
  {
    id: "MOB008",
    name: "Apple iPad",
    serialNumber: "F9K7K1N0YYYY",
    imei: "351336080156800",
    type: "TSP",
    brand: "Apple",
    model: "iPad Pro",
    status: "Available",
  },
  {
    id: "MOB009",
    name: "Huawei Tablet",
    serialNumber: "TL9M11JKL0",
    imei: "351336080156900",
    type: "TSP",
    brand: "Huawei",
    model: "MatePad",
    status: "Assigned",
    assignedTo: "U008",
    dateAssigned: "2024-02-15",
  },
]

export const FAKE_AFFECTATIONS: Affectation[] = [
  {
    id: "AFF001",
    targetId: "U001",
    targetType: "user",
    targetName: "Jean Dupont",
    assetType: "mobile",
    assetId: "MOB001",
    assetName: "Samsung Galaxy S21",
    action: "Affecté",
    date: "2024-01-15",
    timestamp: "2024-01-15 09:30",
  },
  {
    id: "AFF002",
    targetId: "U001",
    targetType: "user",
    targetName: "Jean Dupont",
    assetType: "sim",
    assetId: "SIM001",
    assetName: "+33612345601",
    action: "Affecté",
    date: "2024-01-15",
    timestamp: "2024-01-15 09:45",
  },
  {
    id: "AFF003",
    targetId: "U001",
    targetType: "user",
    targetName: "Jean Dupont",
    assetType: "mobile",
    assetId: "MOB001",
    assetName: "Samsung Galaxy S21",
    action: "Reçu",
    date: "2024-01-16",
    timestamp: "2024-01-16 10:00",
  },
  {
    id: "AFF004",
    targetId: "U003",
    targetType: "user",
    targetName: "Pierre Moreau",
    assetType: "mobile",
    assetId: "MOB003",
    assetName: "Honeywell CT50",
    action: "Affecté",
    date: "2024-02-01",
    timestamp: "2024-02-01 08:00",
  },
  {
    id: "AFF005",
    targetId: "U003",
    targetType: "user",
    targetName: "Pierre Moreau",
    assetType: "mobile",
    assetId: "MOB003",
    assetName: "Honeywell CT50",
    action: "Reçu",
    date: "2024-02-01",
    timestamp: "2024-02-01 14:30",
  },
  {
    id: "AFF006",
    targetId: "U006",
    targetType: "user",
    targetName: "Isabelle Dubois",
    assetType: "mobile",
    assetId: "MOB004",
    assetName: "Zebra MC9300",
    action: "Affecté",
    date: "2024-01-20",
    timestamp: "2024-01-20 11:00",
  },
  {
    id: "AFF007",
    targetId: "U006",
    targetType: "user",
    targetName: "Isabelle Dubois",
    assetType: "mobile",
    assetId: "MOB004",
    assetName: "Zebra MC9300",
    action: "Reçu",
    date: "2024-01-21",
    timestamp: "2024-01-21 09:15",
  },
  {
    id: "AFF008",
    targetId: "Logistique",
    targetType: "service",
    targetName: "Logistique",
    assetType: "internet",
    assetId: "INT001",
    assetName: "LIG-ORG-001",
    action: "Affecté",
    date: "2024-01-10",
    timestamp: "2024-01-10 08:00",
  },
  {
    id: "AFF009",
    targetId: "Logistique",
    targetType: "service",
    targetName: "Logistique",
    assetType: "internet",
    assetId: "INT001",
    assetName: "LIG-ORG-001",
    action: "Reçu",
    date: "2024-01-11",
    timestamp: "2024-01-11 09:00",
  },
  {
    id: "AFF010",
    targetId: "U004",
    targetType: "user",
    targetName: "Sophie Laurent",
    assetType: "mobile",
    assetId: "MOB006",
    assetName: "Datalogic Falcon",
    action: "Affecté",
    date: "2024-01-10",
    timestamp: "2024-01-10 10:00",
  },
  {
    id: "AFF011",
    targetId: "U007",
    targetType: "user",
    targetName: "Luc Martin",
    assetType: "mobile",
    assetId: "MOB007",
    assetName: "Samsung Galaxy Tablet",
    action: "Affecté",
    date: "2024-02-10",
    timestamp: "2024-02-10 09:00",
  },
  {
    id: "AFF012",
    targetId: "U008",
    targetType: "user",
    targetName: "Céline Rousseau",
    assetType: "mobile",
    assetId: "MOB009",
    assetName: "Huawei Tablet",
    action: "Affecté",
    date: "2024-02-15",
    timestamp: "2024-02-15 10:30",
  },
]

export const SERVICES = [
  "Logistique",
  "Opérations",
  "IT",
  "Administration",
  "Support",
  "Ventes",
  "Production",
  "Qualité",
]

export const FAKE_EQUIPMENT = [
  {
    id: "E001",
    name: "Samsung Galaxy S21",
    type: "Mobile",
    status: "Assigned",
    assignedTo: "U001",
    equipmentStatus: "Received",
    dateReceived: "2024-01-15",
  },
  {
    id: "E002",
    name: "Orange SIM",
    type: "SIM",
    status: "Assigned",
    assignedTo: "U001",
    equipmentStatus: "Received",
    dateReceived: "2024-01-15",
  },
  {
    id: "E003",
    name: "Honeywell CT50",
    type: "PDA",
    status: "Assigned",
    assignedTo: "U003",
    equipmentStatus: "Received",
    dateReceived: "2024-02-01",
  },
  {
    id: "E004",
    name: "Zebra MC9300",
    type: "PDA",
    status: "Assigned",
    assignedTo: "U006",
    equipmentStatus: "Received",
    dateReceived: "2024-01-20",
  },
  {
    id: "E005",
    name: "Internet Line Orange",
    type: "Internet",
    status: "Active",
    assignedTo: "Logistique",
    equipmentStatus: "Active",
    dateReceived: "2024-01-10",
  },
]

export const FAKE_AGENCIES: Agence[] = [
  {
    id: "A001",
    name: "Agence Nord",
    address: "123 Rue de Paris",
    city: "Casablanca",
    phone: "+212 5 22 12 34 56",
    chefAgence: "Laurent Dupuis",
    departmentCount: 5,
    status: "Active",
    createdDate: "2021-01-10",
  },
  {
    id: "A002",
    name: "Agence Sud",
    address: "456 Avenue Marrakech",
    city: "Marrakech",
    phone: "+212 5 24 45 67 89",
    chefAgence: "Sophie Fontaine",
    departmentCount: 4,
    status: "Active",
    createdDate: "2021-06-15",
  },
  {
    id: "A003",
    name: "Agence Est",
    address: "789 Boulevard Fès",
    city: "Fès",
    phone: "+212 5 35 65 43 21",
    chefAgence: "Marc Lefevre",
    departmentCount: 3,
    status: "Active",
    createdDate: "2022-03-20",
  },
  {
    id: "A004",
    name: "Agence Ouest",
    address: "321 Rue Rabat",
    city: "Rabat",
    phone: "+212 5 37 12 98 76",
    chefAgence: "Isabelle Bernard",
    departmentCount: 2,
    status: "Inactive",
    createdDate: "2022-09-01",
  },
]

export const FAKE_DEPARTMENTS: Department[] = [
  {
    id: "D001",
    name: "Logistique",
    chief: "Jean Dupont",
    memberCount: 5,
    status: "Active",
    createdDate: "2020-01-15",
  },
  {
    id: "D002",
    name: "Opérations",
    chief: "Marie Bernard",
    memberCount: 3,
    status: "Active",
    createdDate: "2020-02-10",
  },
  {
    id: "D003",
    name: "Administration",
    chief: "Marie Bernard",
    memberCount: 2,
    status: "Active",
    createdDate: "2020-03-20",
  },
  {
    id: "D004",
    name: "Maintenance",
    chief: "Thomas Michel",
    memberCount: 4,
    status: "Active",
    createdDate: "2020-04-05",
  },
  {
    id: "D005",
    name: "IT",
    chief: "Luc Martin",
    memberCount: 3,
    status: "Active",
    createdDate: "2020-05-12",
  },
  {
    id: "D006",
    name: "Ressources Humaines",
    chief: "Céline Rousseau",
    memberCount: 2,
    status: "Active",
    createdDate: "2020-06-18",
  },
  {
    id: "D007",
    name: "Ventes",
    chief: "Marc Fontaine",
    memberCount: 4,
    status: "Inactive",
    createdDate: "2020-07-22",
  },
  {
    id: "D008",
    name: "Support",
    chief: "Nathalie Gauthier",
    memberCount: 2,
    status: "Active",
    createdDate: "2020-08-10",
  },
  {
    id: "D009",
    name: "Production",
    chief: "Denis Leclerc",
    memberCount: 5,
    status: "Active",
    createdDate: "2020-09-15",
  },
  {
    id: "D010",
    name: "Qualité",
    chief: "Véronique Petit",
    memberCount: 3,
    status: "Active",
    createdDate: "2020-10-20",
  },
]
