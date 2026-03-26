import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';
import appLogo from '../assets/avatar.jpg';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore(state => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Generate a unique Discord-like ID (e.g., 4 random digits)
    const uniqueId = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedId = isLogin ? '1234' : uniqueId; // Mock ID for login, random for register

    // Simulate API call
    setTimeout(() => {
      login({ 
        id: generatedId, 
        name: isLogin ? 'User' : (name || 'New User'), 
        status: 'online' 
      });
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
      <div className="w-[420px] p-10 rounded-[24px] z-10 relative border border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl">
        <div className="mb-10 text-center relative">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center transition-transform hover:scale-105 overflow-hidden shadow-lg border border-[#333]">
            <img src={appLogo} alt="Friendly Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {isLogin ? 'С возвращением' : 'Создать аккаунт'}
          </h1>
          <p className="text-[#888888] text-sm">
            {isLogin ? 'Введите свои данные для входа' : 'Присоединяйтесь к платформе'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666] w-5 h-5" />
              <input 
                type="text" 
                placeholder="Имя пользователя" 
                required={!isLogin}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#666666] focus:outline-none focus:border-white transition-colors" 
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666] w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email адрес" 
              required
              className="w-full bg-[#111111] border border-[#222222] rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#666666] focus:outline-none focus:border-white transition-colors" 
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666] w-5 h-5" />
            <input 
              type="password" 
              placeholder="Пароль" 
              required
              className="w-full bg-[#111111] border border-[#222222] rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#666666] focus:outline-none focus:border-white transition-colors" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors mt-6 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-[#888888] hover:text-white transition-colors"
          >
            {isLogin ? "Нет аккаунта? Создать" : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}