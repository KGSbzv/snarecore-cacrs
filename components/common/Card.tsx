import React from 'react';

interface CardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, icon, action }) => {
    return (
        <div className="bg-card rounded-lg p-5 border border-border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-text flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </h3>
                {action && <div>{action}</div>}
            </div>
            <div>{children}</div>
        </div>
    );
};