import React from 'react';
import type { SentimentResult } from '../types';
import { Card } from './common/Card';
import { SmileIcon } from './icons/SmileIcon';
import { FrownIcon } from './icons/FrownIcon';
import { MehIcon } from './icons/MehIcon';

interface SentimentAnalysisProps {
    sentiment: SentimentResult;
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ sentiment }) => {
    const sentimentConfig = {
        Positive: {
            icon: <SmileIcon className="w-8 h-8 text-green-400" />,
            bgColor: 'bg-green-900/50',
            textColor: 'text-green-300',
            label: 'Positive Sentiment'
        },
        Negative: {
            icon: <FrownIcon className="w-8 h-8 text-red-400" />,
            bgColor: 'bg-red-900/50',
            textColor: 'text-red-300',
            label: 'Negative Sentiment'
        },
        Neutral: {
            icon: <MehIcon className="w-8 h-8 text-yellow-400" />,
            bgColor: 'bg-yellow-900/50',
            textColor: 'text-yellow-300',
            label: 'Neutral Sentiment'
        },
    };

    const config = sentimentConfig[sentiment.overall];

    return (
        <Card title="Sentiment Analysis">
            <div className={`flex items-center p-4 rounded-lg ${config.bgColor}`}>
                <div className="mr-4">
                    {config.icon}
                </div>
                <div>
                    <p className={`font-semibold text-lg ${config.textColor}`}>{config.label}</p>
                    <p className="text-sm text-gray-400">
                        Overall Score: <span className="font-mono">{sentiment.score.toFixed(2)}</span>
                    </p>
                </div>
            </div>
        </Card>
    );
};