import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button, Input } from './ui/BaseComponents';

const AUTH_COOLDOWN_MS = 5000;

export const AuthModal = ({ isOpen, onClose, onAuth }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (now >= cooldownUntil) return undefined;

        const timer = window.setInterval(() => setNow(Date.now()), 500);
        return () => window.clearInterval(timer);
    }, [cooldownUntil, now]);

    const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
    const isCooldownActive = cooldownRemaining > 0;

    // Client cooldown is a UX throttle; Firebase server-side limits remain the security boundary.
    const startCooldown = () => {
        const next = Date.now() + AUTH_COOLDOWN_MS;
        setNow(Date.now());
        setCooldownUntil(next);
    };

    const resetForm = () => {
        setFormData({ email: '', password: '', displayName: '', confirmPassword: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if ((resetMode || !isSignUp) && isCooldownActive) {
            setError(`Lutfen ${cooldownRemaining} saniye sonra tekrar deneyin`);
            return;
        }

        if (!formData.email || !formData.email.includes('@')) {
            setError('Gecerli bir e-posta adresi girin');
            return;
        }

        if (resetMode) {
            try {
                setLoading(true);
                await onAuth('reset', { email: formData.email });
                alert('Eger bu e-posta kayitliysa sifre sifirlama baglantisi gonderilecektir.');
                setResetMode(false);
                resetForm();
            } catch (err) {
                setError(err.message);
            } finally {
                startCooldown();
                setLoading(false);
            }
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            setError('Sifre en az 6 karakter olmalidir');
            return;
        }

        if (isSignUp) {
            if (!formData.displayName.trim()) {
                setError('Isim soyisim gereklidir');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Sifreler eslesmiyor');
                return;
            }
        }

        try {
            setLoading(true);
            await onAuth(isSignUp ? 'signup' : 'signin', formData);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isSignUp) {
                startCooldown();
            }
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
        setResetMode(false);
    };

    const toggleResetMode = () => {
        setResetMode(!resetMode);
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {resetMode ? 'Sifremi Unuttum' : isSignUp ? 'Kayit Ol' : 'Giris Yap'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {!resetMode && isSignUp && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User size={16} /> Isim Soyisim
                            </label>
                            <Input
                                type="text"
                                placeholder="Orn: Yusuf Karamuk"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Mail size={16} /> E-posta
                        </label>
                        <Input
                            type="email"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    {!resetMode && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Lock size={16} /> Sifre
                                </label>
                                <Input
                                    type="password"
                                    placeholder="En az 6 karakter"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            {isSignUp && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Lock size={16} /> Sifre Tekrar
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="Sifrenizi tekrar girin"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <Button type="submit" disabled={loading || isCooldownActive} className="w-full mt-2">
                        {loading
                            ? 'Lutfen bekleyin...'
                            : isCooldownActive
                                ? `Tekrar dene (${cooldownRemaining})`
                                : resetMode ? 'Sifirlama Baglantisi Gonder' : isSignUp ? 'Kayit Ol' : 'Giris Yap'}
                    </Button>

                    <div className="flex flex-col gap-2 text-sm text-center">
                        {!resetMode && (
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-purple-600 hover:underline"
                            >
                                {isSignUp ? 'Zaten hesabim var, giris yap' : 'Hesabin yok mu? Kayit ol'}
                            </button>
                        )}

                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={toggleResetMode}
                                className="text-gray-600 hover:underline"
                            >
                                {resetMode ? 'Giris ekranina don' : 'Sifremi unuttum'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
