import type { ShopItem } from '../types';

export const shopItems: ShopItem[] = [
  {
    id: 's1',
    name: 'Подписка на Udemy',
    description: 'Доступ к курсам. +10% к получаемому опыту.',
    cost: 500,
    type: 'equipment',
    purchased: false,
    effect: 'xp_boost_10'
  },
  {
    id: 's2',
    name: 'Лицензия JetBrains',
    description: 'Удобная IDE повышает скорость работы на 15%.',
    cost: 1000,
    type: 'equipment',
    purchased: false,
    effect: 'speed_boost_15'
  },
  {
    id: 's3',
    name: 'Тимбилдинг',
    description: 'Мероприятие для команды. +20% к продуктивности.',
    cost: 2000,
    type: 'buff',
    purchased: false,
    effect: 'productivity_20'
  },
  {
    id: 's4',
    name: 'Найм Рекрутера',
    description: 'Поиск талантов. +50 к рейтингу студии.',
    cost: 3000,
    type: 'buff',
    purchased: false,
    effect: 'rating_50'
  },
  {
    id: 's5',
    name: 'Собственный Сервер',
    description: 'Локальная инфраструктура. Шанс 10% завершить этап мгновенно.',
    cost: 5000,
    type: 'equipment',
    purchased: false,
    effect: 'auto_complete_chance'
  },
  {
    id: 's6',
    name: 'Конференция',
    description: 'Поездка на IT-конференцию. +1 уровень всем сотрудникам.',
    cost: 15000,
    type: 'buff',
    purchased: false,
    effect: 'level_up_team'
  }
];