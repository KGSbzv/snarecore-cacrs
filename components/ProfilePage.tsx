import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card } from './common/Card';
import { LoaderIcon } from './icons/LoaderIcon';
import { SaveIcon } from './icons/SaveIcon';
import { Toast } from './common/Toast';
import { UserIcon } from './icons/UserIcon';
import { UploadIcon } from './icons/UploadIcon';

export const ProfilePage: React.FC = () => {
    const { currentUser, updateCurrentUserProfile } = useAppContext();
    
    const [displayName, setDisplayName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setDisplayName(currentUser.name);
            setAvatarPreview(currentUser.avatarUrl || null);
            setAvatarFile(null); // Reset file on user change or successful save
        }
    }, [currentUser]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            setError("Please select a valid image file (e.g., JPG, PNG, GIF).");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !displayName.trim()) {
            setError("Display name cannot be empty.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            await updateCurrentUserProfile({ 
                name: displayName, 
                // Only include avatar if a new file has been selected
                ...(avatarFile && { avatar: avatarFile })
            });
            setShowSuccessToast(true);
            setAvatarFile(null); // Clear file from state after successful upload
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <LoaderIcon className="w-8 h-8 animate-spin" />
            </div>
        );
    }
    
    const isFormDirty = displayName !== currentUser.name || !!avatarFile;

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in-up">
            <form onSubmit={handleSave}>
                <Card 
                    title="Edit Profile" 
                    icon={<UserIcon className="w-6 h-6 text-text-secondary" />}
                >
                    {error && <div className="mb-4 p-3 text-center text-error bg-error/10 rounded-lg">{error}</div>}
                    
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Avatar Section */}
                        <div className="flex-shrink-0">
                            <div className="relative group">
                                <img 
                                    src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'A')}&background=374151&color=F9FAFB&size=128`} 
                                    alt="Avatar Preview" 
                                    className="w-32 h-32 rounded-full object-cover border-4 border-border"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Change avatar"
                                >
                                    <UploadIcon className="w-8 h-8" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleAvatarChange} 
                                    accept="image/png, image/jpeg, image/gif" 
                                    className="hidden" 
                                />
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6 flex-1 w-full">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary">Display Name</label>
                                <input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
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
                                    value={currentUser.email}
                                    className="mt-1 w-full bg-background/50 border border-border rounded-lg text-text-secondary p-2 cursor-not-allowed"
                                    disabled
                                />
                            </div>
                             <div>
                                <label htmlFor="role" className="block text-sm font-medium text-text-secondary">Role</label>
                                <input
                                    id="role"
                                    name="role"
                                    type="text"
                                    value={currentUser.role}
                                    className="mt-1 w-full bg-background/50 border border-border rounded-lg text-text-secondary p-2 cursor-not-allowed"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-border">
                        <button
                            type="submit"
                            disabled={isLoading || !isFormDirty}
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
                </Card>
            {/* FIX: Moved the closing </form> tag to correctly wrap the <Card> component. 
                The previous mismatched tag order caused a JSX parsing error. */}
            </form>
            {showSuccessToast && <Toast message="Profile updated successfully!" onClose={() => setShowSuccessToast(false)} />}
        </div>
    );
};
