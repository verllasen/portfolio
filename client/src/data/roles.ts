import { Code, Palette, Terminal, Database, Smartphone, Gamepad, Globe, Server, Layers, Cpu, Shield } from 'lucide-react';
import type { Specialization } from '../types';

export interface RoleDef {
  id: string;
  label: string;
  icon: any;
  color: string;
  desc: string;
}

export const SPECIALIZATION_ROLES: Record<Specialization, RoleDef[]> = {
  'Frontend': [
    { id: 'HTML', label: 'HTML Архитектор', icon: Code, color: 'text-orange-400', desc: 'Структура и SEO' },
    { id: 'CSS', label: 'CSS Художник', icon: Palette, color: 'text-blue-400', desc: 'Стили и анимации' },
    { id: 'JS', label: 'JS Разработчик', icon: Terminal, color: 'text-yellow-400', desc: 'Логика интерфейса' },
    { id: 'DB', label: 'DB Architect', icon: Database, color: 'text-purple-400', desc: 'Проектирование БД' },
  ],
  'Backend': [
    { id: 'API', label: 'API Инженер', icon: Server, color: 'text-green-400', desc: 'REST и GraphQL' },
    { id: 'DB', label: 'Админ БД', icon: Database, color: 'text-purple-400', desc: 'SQL и NoSQL' },
    { id: 'DevOps', label: 'DevOps', icon: Layers, color: 'text-cyan-400', desc: 'CI/CD и сервера' },
    { id: 'Security', label: 'Security Эксперт', icon: Shield, color: 'text-red-400', desc: 'Защита данных' },
  ],
  'Fullstack': [
    { id: 'Frontend', label: 'Frontend', icon: Globe, color: 'text-blue-400', desc: 'Клиентская часть' },
    { id: 'Backend', label: 'Backend', icon: Server, color: 'text-green-400', desc: 'Серверная часть' },
    { id: 'DB', label: 'Database', icon: Database, color: 'text-purple-400', desc: 'Базы данных' },
    { id: 'Arch', label: 'Архитектор', icon: Layers, color: 'text-orange-400', desc: 'Системный дизайн' },
  ],
  'Mobile': [
    { id: 'iOS', label: 'iOS Разработчик', icon: Smartphone, color: 'text-gray-400', desc: 'Swift и UIKit' },
    { id: 'Android', label: 'Android Разработчик', icon: Smartphone, color: 'text-green-500', desc: 'Kotlin и Jetpack' },
    { id: 'Flutter', label: 'Cross-platform', icon: Layers, color: 'text-blue-400', desc: 'Flutter/React Native' },
    { id: 'UI', label: 'Mobile UI', icon: Palette, color: 'text-pink-400', desc: 'Мобильные интерфейсы' },
  ],
  'GameDev': [
    { id: 'Engine', label: 'Engine Dev', icon: Cpu, color: 'text-blue-500', desc: 'Unity/Unreal' },
    { id: 'Gameplay', label: 'Gameplay Dev', icon: Gamepad, color: 'text-green-400', desc: 'Игровые механики' },
    { id: 'Level', label: 'Level Designer', icon: Layers, color: 'text-orange-400', desc: 'Дизайн уровней' },
    { id: '3D', label: '3D Artist', icon: Palette, color: 'text-purple-400', desc: 'Модели и текстуры' },
  ]
};

// Helper to get role definition
export const getRoleDef = (spec: Specialization, roleId: string): RoleDef | undefined => {
  return SPECIALIZATION_ROLES[spec]?.find(r => r.id === roleId);
};
