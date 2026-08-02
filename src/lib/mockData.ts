import { Product, StockHistory, UserProfile, Location, Tag, Preset } from '../types/stock';

export const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc-1', name: '冷蔵庫' },
  { id: 'loc-2', name: '冷凍庫' },
  { id: 'loc-3', name: '野菜室' },
  { id: 'loc-4', name: 'パントリー' },
  { id: 'loc-5', name: '調味料ラック' }
];

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', name: '飲料', color: '#3b82f6' },
  { id: 'tag-2', name: '調味料', color: '#f59e0b' },
  { id: 'tag-3', name: '乳製品', color: '#06b6d4' },
  { id: 'tag-4', name: '冷凍食品', color: '#6366f1' },
  { id: 'tag-5', name: '生鮮食品', color: '#10b981' },
  { id: 'tag-6', name: 'お菓子', color: '#ec4899' },
  { id: 'tag-7', name: '即席食品', color: '#8b5cf6' }
];

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'preset-001',
    jan_code: '4901330574345',
    name: 'カルビー ポテトチップス うすしお味 60g',
    image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
    location: 'パントリー',
    tags: ['お菓子'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'preset-002',
    jan_code: '4902102000185',
    name: 'コカ・コーラ 500ml PET',
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    location: '冷蔵庫',
    tags: ['飲料'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'preset-003',
    jan_code: '4901001000010',
    name: '味の素 ほんだし 120g箱',
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80',
    location: '調味料ラック',
    tags: ['調味料'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'preset-004',
    jan_code: '4902388000011',
    name: '冷凍讃岐うどん 5食パック',
    image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=300&auto=format&fit=crop&q=80',
    location: '冷凍庫',
    tags: ['冷凍食品', '即席食品'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr-admin-001',
    email: 'admin@freezer.local',
    name: '管理者 太郎',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-member-002',
    email: 'staff@freezer.local',
    name: 'スタッフ 花子',
    role: 'member',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    jan_code: '4901330574345',
    name: 'カルビー ポテトチップス うすしお味 60g',
    image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
    current_stock: 12,
    location: 'パントリー',
    tags: ['お菓子'],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'prod-002',
    jan_code: '4902102000185',
    name: 'コカ・コーラ 500ml PET',
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    current_stock: 24,
    location: '冷蔵庫',
    tags: ['飲料'],
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'prod-003',
    jan_code: '4901001000010',
    name: '味の素 ほんだし 120g箱',
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80',
    current_stock: 2,
    location: '調味料ラック',
    tags: ['調味料'],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'prod-004',
    jan_code: '4902388000011',
    name: '冷凍讃岐うどん 5食パック',
    image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=300&auto=format&fit=crop&q=80',
    current_stock: 0,
    location: '冷凍庫',
    tags: ['冷凍食品', '即席食品'],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prod-005',
    jan_code: '4901777000012',
    name: 'サントリー 伊右衛門 600ml',
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&auto=format&fit=crop&q=80',
    current_stock: 18,
    location: '冷蔵庫',
    tags: ['飲料'],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'prod-006',
    jan_code: '4901330502010',
    name: '新鮮キャベツ (1玉)',
    image_url: 'https://images.unsplash.com/photo-1598170845058-12ef4a457536?w=300&auto=format&fit=crop&q=80',
    current_stock: 1,
    location: '野菜室',
    tags: ['生鮮食品'],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const INITIAL_HISTORIES: StockHistory[] = [
  {
    id: 'hist-001',
    product_id: 'prod-001',
    user_id: 'usr-admin-001',
    change_amount: 15,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    product_name: 'カルビー ポテトチップス うすしお味 60g',
    jan_code: '4901330574345',
    user_email: 'admin@freezer.local',
    user_name: '管理者 太郎',
    location: 'パントリー'
  },
  {
    id: 'hist-002',
    product_id: 'prod-002',
    user_id: 'usr-member-002',
    change_amount: -3,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    product_name: 'コカ・コーラ 500ml PET',
    jan_code: '4902102000185',
    user_email: 'staff@freezer.local',
    user_name: 'スタッフ 花子',
    location: '冷蔵庫'
  }
];
