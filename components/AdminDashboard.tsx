import React, { useState, useMemo, useEffect } from 'react';
import { UserManagement } from './UserManagement';
import { Card } from './common/Card';
import { useAppContext } from '../contexts/AppContext';
import type { AIConfiguration, AiModel, TranscriptionConfig } from '../types';
import { Toast } from './common/Toast';
import { SaveIcon } from './icons/SaveIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { SlidersIcon } from './icons/SlidersIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { useForm, Validator } from '../hooks/useForm';
import { Tooltip } from './common/Tooltip';
import { InfoIcon } from './icons/InfoIcon';
import { LoaderIcon } from './icons/LoaderIcon';

// Local state for the form, using strings for numeric inputs
type AIConfigFormState = Record<AiModel, {
    systemPrompt: string;
    temperature: string;
    maxTokens: string;
}>;

// Helper to convert AppContext config to form state
const toFormState = (config: AIConfiguration): AIConfigFormState => {
    const formState = {} as AIConfigFormState;
    for (const modelKey in config) {
        const model = modelKey as AiModel;
        formState[model] = {
            systemPrompt: config[model].systemPrompt,
            temperature: String(config[model].temperature),
            maxTokens: String(config[model].maxTokens),
        };
    }
    return formState;
};

// Validator for the AI Config form
const validateAIConfig: Validator<AIConfigFormState[AiModel]> = (values) => {
    const errors: Partial<Record<keyof AIConfigFormState[AiModel], string>> = {};
    const temp = parseFloat(values.temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
        errors.temperature = 'Must be a number between 0 and 2.';
    }
    const tokens = parseInt(values.maxTokens, 10);
    if (isNaN(tokens) || tokens <= 0 || !Number.isInteger(tokens)) {
        errors.maxTokens = 'Must be a positive whole number.';
    }
    return errors;
};

const AIConfigEditor: React.FC = () => {
    const { aiConfig, saveAIConfig } = useAppContext();
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const forms = useMemo(() => (Object.keys(aiConfig) as AiModel[]).map(model => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useForm(toFormState(aiConfig)[model], validateAIConfig);
    }), [aiConfig]);

    useEffect(() => {
        // When config is loaded from backend, reset forms to reflect the new initial state.
        forms.forEach(form => form.resetForm());
    }, [aiConfig]); // This effect depends on aiConfig, which is fetched from the backend.


    const handleSaveChanges = async () => {
        const newConfig = JSON.parse(JSON.stringify(aiConfig));
        let allFormsValid = true;

        (Object.keys(aiConfig) as AiModel[]).forEach((model, index) => {
            const form = forms[index];
            if (!form.isValid) {
                allFormsValid = false;
                return;
            }
            const { values } = form;
            const temp = parseFloat(values.temperature);
            const tokens = parseInt(values.maxTokens, 10);

            newConfig[model].systemPrompt = values.systemPrompt;
            newConfig[model].temperature = temp;
            newConfig[model].maxTokens = tokens;
        });
        
        if (allFormsValid) {
            setIsSaving(true);
            try {
                await saveAIConfig(newConfig);
                setShowSaveToast(true);
                forms.forEach(form => form.resetForm()); // Reset dirty state after save
            } catch (error) {
                alert(`Error saving configuration: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                setIsSaving(false);
            }
        } else {
            alert("Please fix the errors before saving.");
        }
    };
    
    const isAnyFormDirty = forms.some(form => form.isDirty);
    const areAllFormsValid = forms.every(form => form.isValid);

    return (
        <>
            <div className="relative">
                 {isSaving && (
                    <div className="absolute inset-0 bg-card/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-3 text-lg font-semibold">
                            <LoaderIcon className="w-6 h-6 animate-spin text-primary" />
                            <span>Saving AI Configuration...</span>
                        </div>
                    </div>
                )}
                <fieldset disabled={isSaving}>
                    <div className="space-y-6">
                        {(Object.keys(aiConfig) as AiModel[]).map((model, index) => {
                            const { values, errors, handleChange } = forms[index];
                            return (
                                <div key={model}>
                                    <h4 className="text-lg font-medium text-primary capitalize border-b border-border pb-2 mb-4 font-mono">{model}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary mb-1">System Prompt</label>
                                            <textarea
                                                name="systemPrompt"
                                                value={values.systemPrompt}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full bg-background border border-border rounded-md text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                                                Temperature
                                                <Tooltip content="Controls randomness. Lower values are more deterministic, higher values are more creative. Range: 0.0 to 2.0.">
                                                    <InfoIcon className="w-4 h-4 text-text-secondary cursor-help" />
                                                </Tooltip>
                                            </label>
                                            <input
                                                type="number"
                                                name="temperature"
                                                step="0.1"
                                                value={values.temperature}
                                                onChange={handleChange}
                                                className={`w-full bg-background border rounded-md text-white p-2 focus:outline-none focus:ring-2 font-mono ${errors.temperature ? 'border-error ring-error' : 'border-border focus:ring-primary focus:border-primary'}`}
                                            />
                                            {errors.temperature && <p className="mt-1 text-xs text-error">{errors.temperature}</p>}
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                                                Max Tokens
                                                <Tooltip content="The maximum number of tokens to generate in the response.">
                                                   <InfoIcon className="w-4 h-4 text-text-secondary cursor-help" />
                                                </Tooltip>
                                            </label>
                                            <input
                                                type="number"
                                                name="maxTokens"
                                                step="100"
                                                value={values.maxTokens}
                                                onChange={handleChange}
                                                className={`w-full bg-background border rounded-md text-white p-2 focus:outline-none focus:ring-2 font-mono ${errors.maxTokens ? 'border-error ring-error' : 'border-border focus:ring-primary focus:border-primary'}`}
                                            />
                                             {errors.maxTokens && <p className="mt-1 text-xs text-error">{errors.maxTokens}</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </fieldset>
            </div>
            <div className="mt-6 text-right">
                <button 
                    onClick={handleSaveChanges} 
                    disabled={!isAnyFormDirty || !areAllFormsValid || isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isSaving ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SaveIcon className="w-5 h-5"/>}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            {showSaveToast && <Toast message="AI configuration saved successfully!" onClose={() => setShowSaveToast(false)} />}
        </>
    );
};

// Local state for the form, using strings/booleans for inputs
type TranscriptionConfigFormState = Omit<TranscriptionConfig, 'minConfidence'> & {
    minConfidence: string;
};

// Validator for the Transcription Config form
const validateTranscriptionConfig: Validator<TranscriptionConfigFormState> = (values) => {
    const errors: Partial<Record<keyof TranscriptionConfigFormState, string>> = {};
    const confidence = parseFloat(values.minConfidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        errors.minConfidence = 'Must be a number between 0 and 1.';
    }
    if (!values.language.trim()) {
        errors.language = 'Language is required (use "auto" for detection).';
    }
    return errors;
};


const TranscriptionConfigEditor: React.FC = () => {
    const { transcriptionConfig, saveTranscriptionConfig } = useAppContext();
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const initialFormState: TranscriptionConfigFormState = useMemo(() => ({
        ...transcriptionConfig,
        minConfidence: String(transcriptionConfig.minConfidence),
    }), [transcriptionConfig]);

    const { values, errors, isDirty, isValid, handleChange, resetForm } = useForm(initialFormState, validateTranscriptionConfig);
    
    useEffect(() => {
        resetForm();
    }, [transcriptionConfig]);

    const handleSaveChanges = async () => {
        if (!isValid) {
            alert("Please fix the errors before saving.");
            return;
        }
        
        setIsSaving(true);
        try {
            const confidence = parseFloat(values.minConfidence);
            const newConfig: TranscriptionConfig = { ...values, minConfidence: confidence };
            
            await saveTranscriptionConfig(newConfig);
            setShowSaveToast(true);
            resetForm(); // Resets dirty state
        } catch (error) {
            alert(`Error saving configuration: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="relative">
                {isSaving && (
                    <div className="absolute inset-0 bg-card/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-3 text-lg font-semibold">
                            <LoaderIcon className="w-6 h-6 animate-spin text-primary" />
                            <span>Saving Transcription Settings...</span>
                        </div>
                    </div>
                )}
                <fieldset disabled={isSaving}>
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                 <label htmlFor="modelSize" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                                    Model Size
                                    <Tooltip content="Larger models are more accurate but slower. 'Medium' is a good balance.">
                                        <InfoIcon className="w-4 h-4 text-text-secondary cursor-help" />
                                    </Tooltip>
                                 </label>
                                 <select id="modelSize" name="modelSize" value={values.modelSize} onChange={handleChange} className="w-full bg-background border border-border rounded-md text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono">
                                    <option value="tiny">Tiny</option>
                                    <option value="base">Base</option>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                 </select>
                             </div>
                             <div>
                                <label htmlFor="language" className="block text-sm font-medium text-text-secondary mb-1">Language</label>
                                <input id="language" name="language" type="text" value={values.language} onChange={handleChange} placeholder="e.g., auto, en, fr" className={`w-full bg-background border rounded-md text-white p-2 focus:outline-none focus:ring-2 font-mono ${errors.language ? 'border-error ring-error' : 'border-border focus:ring-primary focus:border-primary'}`} />
                                {errors.language && <p className="mt-1 text-xs text-error">{errors.language}</p>}
                             </div>
                             <div>
                                <label htmlFor="computeType" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                                    Compute Type
                                    <Tooltip content="'int8' is fastest and uses less memory. 'float16' or 'float32' can improve accuracy on some hardware.">
                                        <InfoIcon className="w-4 h-4 text-text-secondary cursor-help" />
                                    </Tooltip>
                                </label>
                                <select id="computeType" name="computeType" value={values.computeType} onChange={handleChange} className="w-full bg-background border border-border rounded-md text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono">
                                    <option value="int8">int8</option>
                                    <option value="float16">float16</option>
                                    <option value="float32">float32</option>
                                 </select>
                             </div>
                             <div>
                                <label htmlFor="minConfidence" className="block text-sm font-medium text-text-secondary mb-1">Min Confidence</label>
                                <input id="minConfidence" name="minConfidence" type="number" step="0.05" value={values.minConfidence} onChange={handleChange} className={`w-full bg-background border rounded-md text-white p-2 focus:outline-none focus:ring-2 font-mono ${errors.minConfidence ? 'border-error ring-error' : 'border-border focus:ring-primary focus:border-primary'}`} />
                                 {errors.minConfidence && <p className="mt-1 text-xs text-error">{errors.minConfidence}</p>}
                             </div>
                             <div className="lg:col-span-2 flex items-end space-x-8">
                                 <div className="flex items-center">
                                    <input id="vadFilter" name="vadFilter" type="checkbox" checked={values.vadFilter} onChange={handleChange} className="h-4 w-4 text-primary bg-card border-border rounded focus:ring-primary" />
                                     <label htmlFor="vadFilter" className="flex items-center gap-2 ml-2 block text-sm text-text">
                                        VAD Filter
                                        <Tooltip content="Voice Activity Detection. Filters out parts of the audio with no speech.">
                                            <InfoIcon className="w-4 h-4 text-text-secondary cursor-help" />
                                        </Tooltip>
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input id="wordTimestamps" name="wordTimestamps" type="checkbox" checked={values.wordTimestamps} onChange={handleChange} className="h-4 w-4 text-primary bg-card border-border rounded focus:ring-primary" />
                                    <label htmlFor="wordTimestamps" className="flex items-center gap-2 ml-2 block text-sm text-text">
                                        Word Timestamps
                                        <Tooltip content="Provides timestamps for individual words, not just segments. Can be more resource-intensive.">
                                            <InfoIcon className="w-4 h-4 text-text-secondary cursor-help" />
                                        </Tooltip>
                                    </label>
                                </div>
                             </div>
                         </div>
                    </div>
                </fieldset>
            </div>
            <div className="mt-6 text-right">
                <button 
                    onClick={handleSaveChanges} 
                    disabled={!isDirty || !isValid || isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isSaving ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SaveIcon className="w-5 h-5"/>}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            {showSaveToast && <Toast message="Transcription configuration saved!" onClose={() => setShowSaveToast(false)} />}
        </>
    );
};


export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ai' | 'transcription'>('ai');
    
    return (
        <div className="h-full flex flex-col bg-transparent text-text">
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <UserManagement />

                <Card title="System Configuration" icon={<ShieldIcon className="w-5 h-5 text-text-secondary" />}>
                    <div className="flex border-b border-border mb-6">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex items-center gap-3 px-4 py-3 font-medium transition-colors -mb-px ${
                                activeTab === 'ai'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-text-secondary hover:text-white'
                            }`}
                        >
                            <SettingsIcon className="w-5 h-5" /> AI Model Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('transcription')}
                            className={`flex items-center gap-3 px-4 py-3 font-medium transition-colors -mb-px ${
                                activeTab === 'transcription'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-text-secondary hover:text-white'
                            }`}
                        >
                            <SlidersIcon className="w-5 h-5" /> Transcription Pipeline
                        </button>
                    </div>

                    <div>
                        {activeTab === 'ai' && <AIConfigEditor />}
                        {activeTab === 'transcription' && <TranscriptionConfigEditor />}
                    </div>
                </Card>
            </main>
        </div>
    );
};