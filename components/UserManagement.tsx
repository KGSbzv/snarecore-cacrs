import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User } from '../types';
import { Card } from './common/Card';
import { Modal } from './common/Modal';
import { EditIcon } from './icons/EditIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { UsersIcon } from './icons/UsersIcon';

const UserForm: React.FC<{ user?: User | null; onSave: (user: Omit<User, 'id'> | User) => void; onCancel: () => void; }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'USER',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            onSave({ ...user, ...formData });
        } else {
            onSave(formData);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-text-secondary">Role</label>
                <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-text-secondary bg-border rounded-md hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">Save</button>
            </div>
        </form>
    );
};


export const UserManagement: React.FC = () => {
    const { users, addUser, updateUser, deleteUser } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newUserCredentials, setNewUserCredentials] = useState<{ email: string; password: string } | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUserClick = (user: User) => {
        setUserToDelete(user);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.id);
            setUserToDelete(null);
        } catch (error) {
            alert(`Error deleting user: ${error instanceof Error ? error.message : error}`);
        }
    };
    
    const generateTempPassword = () => {
        return Math.random().toString(36).slice(-8);
    };

    const handleSaveUser = async (user: Omit<User, 'id'> | User) => {
        try {
            if ('id' in user) {
                await updateUser(user);
            } else {
                const tempPassword = generateTempPassword();
                await addUser(user);
                setNewUserCredentials({ email: user.email, password: tempPassword });
            }
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            alert(`Error saving user: ${error instanceof Error ? error.message : error}`);
        }
    };

    return (
        <Card title="User Management" icon={<UsersIcon className="w-5 h-5 text-text-secondary" />}>
            <div className="mb-4 flex justify-end">
                <button onClick={handleAddUser} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2 font-semibold transition-transform transform hover:scale-105">
                    <UserPlusIcon className="w-5 h-5" />
                    Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-background/60 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => handleEditUser(user)} className="text-primary hover:text-primary-hover transition-colors"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteUserClick(user)} className="text-error hover:brightness-125 transition-all"><Trash2Icon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
                <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                title="Confirm User Deletion"
            >
                <div className="text-center">
                    <AlertTriangleIcon className="w-12 h-12 text-error mx-auto mb-4" />
                    <p className="text-lg text-text">
                        Are you sure you want to permanently delete this user?
                    </p>
                    <div className="my-4 p-4 bg-background/50 rounded-lg border border-border">
                        <p className="font-semibold text-white truncate text-lg">{userToDelete?.name}</p>
                        <p className="text-sm text-text-secondary truncate">{userToDelete?.email}</p>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                        This action cannot be undone. All associated data will be removed forever.
                    </p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => setUserToDelete(null)}
                            className="px-6 py-2 text-sm font-medium text-text-secondary bg-border rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteUser}
                            className="px-6 py-2 text-sm font-medium text-white bg-error rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-error"
                        >
                            Yes, Delete User
                        </button>
                    </div>
                </div>
            </Modal>
            
            <Modal
                isOpen={!!newUserCredentials}
                onClose={() => setNewUserCredentials(null)}
                title="User Created Successfully"
            >
                <div className="text-center">
                     <CheckCircleIcon className="w-12 h-12 text-success mx-auto mb-4" />
                    <p className="text-sm text-text-secondary">
                        A new user account has been created for <span className="font-bold text-white">{newUserCredentials?.email}</span>.
                    </p>
                    <div className="mt-4 p-3 bg-black rounded-md border border-border">
                        <p className="text-xs text-text-secondary">Temporary Password:</p>
                        <p className="text-lg font-mono text-center text-success tracking-widest py-2">
                            {newUserCredentials?.password}
                        </p>
                    </div>
                    <p className="mt-4 text-xs text-warning/80">
                        Please share this password securely. The user should change it after their first login.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => setNewUserCredentials(null)}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};