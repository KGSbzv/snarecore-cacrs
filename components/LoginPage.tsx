import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { LoaderIcon } from './icons/LoaderIcon';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('password');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAppContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-center text-white mb-6">
                   SNARECORE
                </h1>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Adresse e-mail</label>
                        <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="vous@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">Mot de passe</label>
                         <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-center text-error bg-error/10 p-2 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Se connecter'}
                        </button>
                    </div>
                </form>
                
                <a href="#" className="block text-sm text-center text-blue-400 hover:underline mt-6">
                    Demander un accès
                </a>
            </div>
        </div>
    );
};