import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card } from './common/Card';
import { User } from '../types';
import { LoaderIcon } from './icons/LoaderIcon';
import { SaveIcon } from './icons/SaveIcon';
import { Toast } from './common/Toast';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';

export const ProfilePage: React.FC = () => {
    const { currentUser, updateUser } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        setIsLoading(true);
        setError(null);
        try {
            await updateUser(formData as User);
            setShowSuccessToast(true);
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (currentUser) {
            setFormData({
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
            });
        }
        setIsEditing(false);
    };

    if (!currentUser) {
        return <div className="p-6 text-center">Loading user profile...</div>;
    }

    const ProfileDetail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
        <div>
            <p className="text-sm font-medium text-text-secondary">{label}</p>
            <p className="text-lg text-text">{value}</p>
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Card 
                title="User Profile" 
                icon={<UserIcon className="w-6 h-6 text-text-secondary" />}
                action={!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-border hover:bg-gray-600 rounded-lg"
                    >
                        <EditIcon className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            >
                {error && <div className="mb-4 p-3 text-center text-error bg-error/10 rounded-lg">{error}</div>}
                
                {!isEditing ? (
                    <div className="space-y-6">
                        <ProfileDetail label="Full Name" value={currentUser.name} />
                        <ProfileDetail label="Email Address" value={currentUser.email} />
                        <ProfileDetail label="Role" value={currentUser.role} />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="mt-1 w-full bg-background border border-border rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                className="mt-1 w-full bg-background border border-border rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-background/50"
                                required
                                disabled={currentUser.role !== 'ADMIN'}
                            />
                             {currentUser.role !== 'ADMIN' && <p className="mt-1 text-xs text-text-secondary">Email cannot be changed.</p>}
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-text-secondary">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role || 'USER'}
                                onChange={handleChange}
                                className="mt-1 w-full bg-background border border-border rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-background/50"
                                disabled={currentUser.role !== 'ADMIN'}
                            >
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            {currentUser.role !== 'ADMIN' && <p className="mt-1 text-xs text-text-secondary">Role can only be changed by an administrator.</p>}
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 bg-border text-text-secondary rounded-lg hover:bg-gray-600 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderIcon className="w-5 h-5 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon className="w-5 h-5" /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </Card>
            {showSuccessToast && <Toast message="Profile updated successfully!" onClose={() => setShowSuccessToast(false)} />}
        </div>
    );
};
