// Mock data for Task Center UI development
// TODO: Replace with real API calls

export interface TaskSquareItem {
  bdCount: number;
  commission: number;
  createdAt: number;
  deadline: null | number;
  description: string;
  id: number;
  mainSku: string;
  name: string;
  productUrl: string;
  tags: string[];
  videoNum: number;
}

export interface MyTaskItem {
  assignee: string;
  assigneeName: string;
  commission: number;
  createdAt: number;
  deadline: number;
  id: number;
  productUrl: string;
  reward: number;
  status: TaskStatus;
  taskCode: string;
  updatedAt: number;
  videoCompleted: number;
  videoTotal: number;
}

export enum TaskStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  EXPIRED = 3,
  REJECTED = 4,
}

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; label: string }
> = {
  [TaskStatus.PENDING]: { color: 'blue', label: '待开始' },
  [TaskStatus.IN_PROGRESS]: { color: 'orange', label: '进行中' },
  [TaskStatus.COMPLETED]: { color: 'green', label: '已完成' },
  [TaskStatus.EXPIRED]: { color: 'red', label: '已过期' },
  [TaskStatus.REJECTED]: { color: 'default', label: '已拒绝' },
};

export const TAG_COLORS = [
  'blue',
  'purple',
  'cyan',
  'green',
  'orange',
  'magenta',
  'gold',
  'geekblue',
] as const;

export function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length] ?? 'default';
}

// --- Mock Task Square Data ---

export const mockTaskSquareList: TaskSquareItem[] = [
  {
    id: 1,
    name: '夏季美妆护肤推广',
    productUrl: 'https://shopee.co.th/product/123456/789012',
    mainSku: 'SKU-BEAUTY-001',
    commission: 15_000,
    videoNum: 20,
    bdCount: 8,
    deadline: Date.now() + 14 * 86_400_000,
    createdAt: Date.now() - 3 * 86_400_000,
    tags: ['美妆', '护肤', '夏季'],
    description: '推广夏季美妆护肤产品，包括防晒霜、面膜、精华液等热门品类。',
  },
  {
    id: 2,
    name: '手机配件新品上市',
    productUrl: 'https://shopee.co.th/product/234567/890123',
    mainSku: 'SKU-MOBILE-002',
    commission: 8000,
    videoNum: 15,
    bdCount: 5,
    deadline: Date.now() + 21 * 86_400_000,
    createdAt: Date.now() - 5 * 86_400_000,
    tags: ['3C数码', '手机配件', '新品'],
    description: '新款手机壳、充电器、数据线等配件产品推广，面向年轻人群体。',
  },
  {
    id: 3,
    name: '健康饮品品牌合作',
    productUrl: 'https://shopee.co.th/product/345678/901234',
    mainSku: 'SKU-DRINK-003',
    commission: 12_000,
    videoNum: 10,
    bdCount: 4,
    deadline: null,
    createdAt: Date.now() - 7 * 86_400_000,
    tags: ['健康', '饮品', '品牌合作'],
    description: '健康饮品品牌长期合作项目，包括功能性饮料、茶饮等产品线。',
  },
  {
    id: 4,
    name: '家居收纳系列推广',
    productUrl: 'https://shopee.co.th/product/456789/012345',
    mainSku: 'SKU-HOME-004',
    commission: 10_000,
    videoNum: 12,
    bdCount: 6,
    deadline: Date.now() + 10 * 86_400_000,
    createdAt: Date.now() - 2 * 86_400_000,
    tags: ['家居', '收纳', '生活'],
    description: '家居收纳系列产品，包括收纳盒、置物架、衣柜整理等。',
  },
  {
    id: 5,
    name: '运动装备季末促销',
    productUrl: 'https://shopee.co.th/product/567890/123456',
    mainSku: 'SKU-SPORT-005',
    commission: 18_000,
    videoNum: 25,
    bdCount: 10,
    deadline: Date.now() + 7 * 86_400_000,
    createdAt: Date.now() - 10 * 86_400_000,
    tags: ['运动', '促销', '限时'],
    description: '运动装备季末清仓促销活动，包括健身器材、运动服饰等。',
  },
  {
    id: 6,
    name: '宠物食品新品牌入驻',
    productUrl: 'https://shopee.co.th/product/678901/234567',
    mainSku: 'SKU-PET-006',
    commission: 9000,
    videoNum: 8,
    bdCount: 3,
    deadline: Date.now() + 30 * 86_400_000,
    createdAt: Date.now() - 1 * 86_400_000,
    tags: ['宠物', '食品', '新品牌'],
    description: '新入驻宠物食品品牌推广，主打天然无添加猫粮狗粮。',
  },
  {
    id: 7,
    name: '母婴用品专场',
    productUrl: 'https://shopee.co.th/product/789012/345678',
    mainSku: 'SKU-BABY-007',
    commission: 20_000,
    videoNum: 18,
    bdCount: 7,
    deadline: Date.now() + 14 * 86_400_000,
    createdAt: Date.now() - 4 * 86_400_000,
    tags: ['母婴', '专场', '高佣金'],
    description: '母婴用品专场推广活动，包括纸尿裤、奶粉、婴儿护理等。',
  },
  {
    id: 8,
    name: '潮流服饰秋季上新',
    productUrl: 'https://shopee.co.th/product/890123/456789',
    mainSku: 'SKU-FASHION-008',
    commission: 11_000,
    videoNum: 30,
    bdCount: 12,
    deadline: Date.now() + 20 * 86_400_000,
    createdAt: Date.now() - 6 * 86_400_000,
    tags: ['服饰', '潮流', '秋季'],
    description: '秋季潮流服饰新品上架，涵盖女装、男装、配饰等。',
  },
];

// --- Mock My Tasks Data ---

export const mockMyTaskList: MyTaskItem[] = [
  {
    id: 1,
    taskCode: 'TASK-2024-001',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 15_000,
    createdAt: Date.now() - 14 * 86_400_000,
    deadline: Date.now() + 7 * 86_400_000,
    status: TaskStatus.IN_PROGRESS,
    updatedAt: Date.now() - 1 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/123/456',
    commission: 15,
    videoTotal: 10,
    videoCompleted: 4,
  },
  {
    id: 2,
    taskCode: 'TASK-2024-002',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 8000,
    createdAt: Date.now() - 20 * 86_400_000,
    deadline: Date.now() + 3 * 86_400_000,
    status: TaskStatus.PENDING,
    updatedAt: Date.now() - 2 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/234/567',
    commission: 12,
    videoTotal: 5,
    videoCompleted: 0,
  },
  {
    id: 3,
    taskCode: 'TASK-2024-003',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 12_000,
    createdAt: Date.now() - 30 * 86_400_000,
    deadline: Date.now() - 2 * 86_400_000,
    status: TaskStatus.COMPLETED,
    updatedAt: Date.now() - 2 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/345/678',
    commission: 18,
    videoTotal: 8,
    videoCompleted: 8,
  },
  {
    id: 4,
    taskCode: 'TASK-2024-004',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 5000,
    createdAt: Date.now() - 45 * 86_400_000,
    deadline: Date.now() - 10 * 86_400_000,
    status: TaskStatus.EXPIRED,
    updatedAt: Date.now() - 10 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/456/789',
    commission: 8,
    videoTotal: 3,
    videoCompleted: 1,
  },
  {
    id: 5,
    taskCode: 'TASK-2024-005',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 0,
    createdAt: Date.now() - 10 * 86_400_000,
    deadline: Date.now() + 14 * 86_400_000,
    status: TaskStatus.REJECTED,
    updatedAt: Date.now() - 5 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/567/890',
    commission: 10,
    videoTotal: 6,
    videoCompleted: 0,
  },
  {
    id: 6,
    taskCode: 'TASK-2024-006',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 20_000,
    createdAt: Date.now() - 5 * 86_400_000,
    deadline: Date.now() + 25 * 86_400_000,
    status: TaskStatus.IN_PROGRESS,
    updatedAt: Date.now() - 0.5 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/678/901',
    commission: 20,
    videoTotal: 15,
    videoCompleted: 7,
  },
  {
    id: 7,
    taskCode: 'TASK-2024-007',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 6000,
    createdAt: Date.now() - 60 * 86_400_000,
    deadline: Date.now() - 30 * 86_400_000,
    status: TaskStatus.COMPLETED,
    updatedAt: Date.now() - 30 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/789/012',
    commission: 6,
    videoTotal: 4,
    videoCompleted: 4,
  },
  {
    id: 8,
    taskCode: 'TASK-2024-008',
    assignee: 'BD001',
    assigneeName: '张三',
    reward: 9500,
    createdAt: Date.now() - 3 * 86_400_000,
    deadline: Date.now() + 17 * 86_400_000,
    status: TaskStatus.PENDING,
    updatedAt: Date.now() - 3 * 86_400_000,
    productUrl: 'https://shopee.co.th/product/890/123',
    commission: 14,
    videoTotal: 7,
    videoCompleted: 0,
  },
];
