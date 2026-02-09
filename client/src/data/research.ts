import type { ResearchNode } from '../types';

export const researchTree: ResearchNode[] = [
  {
    id: 'r1',
    title: 'Методология Agile',
    description: 'Улучшает командную работу. Открывает доступ к контрактам уровня Medium.',
    cost: 1,
    unlocked: true,
    requiredLevel: 1,
    prerequisites: [],
    effect: 'unlock_medium_missions'
  },
  {
    id: 'r2',
    title: 'Code Review Стандарты',
    description: 'Внедрение стандартов качества кода. +10% к рейтингу студии за миссии.',
    cost: 2,
    unlocked: false,
    requiredLevel: 2,
    prerequisites: ['r1'],
    effect: 'rating_boost_10'
  },
  {
    id: 'r3',
    title: 'Система CI/CD',
    description: 'Автоматическая сборка и деплой. Ускоряет выполнение проектов на 15%.',
    cost: 3,
    unlocked: false,
    requiredLevel: 2,
    prerequisites: ['r1'],
    effect: 'speed_boost_15'
  },
  {
    id: 'r4',
    title: 'Облачная Инфраструктура',
    description: 'Переход на Cloud-решения. Открывает доступ к контрактам уровня Hard.',
    cost: 5,
    unlocked: false,
    requiredLevel: 3,
    prerequisites: ['r3'],
    effect: 'unlock_hard_missions'
  },
  {
    id: 'r5',
    title: 'Корпоративная Культура',
    description: 'Улучшает атмосферу. +20% к продуктивности всей команды.',
    cost: 5,
    unlocked: false,
    requiredLevel: 3,
    prerequisites: ['r2'],
    effect: 'productivity_20'
  },
  {
    id: 'r6',
    title: 'ИИ-Ассистенты',
    description: 'Внедрение нейросетей в разработку. +25% к опыту для всех сотрудников.',
    cost: 8,
    unlocked: false,
    requiredLevel: 4,
    prerequisites: ['r4', 'r5'],
    effect: 'xp_boost_25'
  },
  {
    id: 'r7',
    title: 'Бренд Студии',
    description: 'Глобальная узнаваемость. +50% к денежной награде за контракты.',
    cost: 10,
    unlocked: false,
    requiredLevel: 5,
    prerequisites: ['r6'],
    effect: 'money_boost_50'
  }
];