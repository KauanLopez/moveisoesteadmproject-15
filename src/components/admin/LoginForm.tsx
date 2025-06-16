import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha usuário e senha",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email.trim(), password);
      if (!success) {
        toast({
          title: "Falha no login",
          description: "Usuário ou senha incorretos",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao painel administrativo",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Painel Administrativo</h2>
        <p className="mt-2 text-gray-600">Faça login para acessar o painel</p>
      </div>
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Usuário
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="Digite seu usuário"
              autoComplete="email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-furniture-green hover:bg-furniture-green/90"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
        
        {/* O bloco de texto com as credenciais de teste foi removido daqui */}
      </form>
    </div>
  );
};

export default LoginForm;