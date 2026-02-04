// Admin Dashboard - Settings, Users, Integrations, AI Config

'use client';

import { useState } from 'react';
import {
    Users,
    Shield,
    Plug,
    Sparkles,
    Settings,
    Plus,
    Edit,
    Trash2,
    Check,
    Save,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';

type AdminTab = 'users' | 'security' | 'integrations' | 'ai';

const MOCK_USERS = [
    { id: '1', name: 'Demo User', email: 'demo@example.com', role: 'admin', status: 'active' },
    { id: '2', name: 'John Tech', email: 'john@example.com', role: 'technician', status: 'active' },
    { id: '3', name: 'Sarah Coord', email: 'sarah@example.com', role: 'coordinator', status: 'active' },
    { id: '4', name: 'Mike Field', email: 'mike@example.com', role: 'technician', status: 'inactive' },
];

const ROLE_PERMISSIONS = {
    admin: ['create_jobs', 'edit_jobs', 'delete_jobs', 'manage_users', 'view_reports', 'manage_settings', 'ai_config'],
    coordinator: ['create_jobs', 'edit_jobs', 'view_reports', 'assign_jobs'],
    technician: ['view_jobs', 'update_status', 'upload_files', 'add_comments'],
};

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [aiProvider, setAiProvider] = useState('gemini');
    const [aiModel, setAiModel] = useState('gemini-2.0-flash');
    const [aiPrompt, setAiPrompt] = useState(`You are a helpful workflow assistant. Help users understand job requirements, suggest next steps, and identify potential issues.

Key behaviors:
- Be concise and action-oriented
- Reference relevant policies and procedures
- Flag safety concerns immediately
- Suggest time-saving alternatives when possible`);
    const [aiEnabled, setAiEnabled] = useState(true);

    const AI_PROVIDERS = [
        { id: 'gemini', name: 'Google Gemini', models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash'] },
        { id: 'azure', name: 'Azure OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'] },
        { id: 'aws', name: 'AWS Bedrock', models: ['claude-3-sonnet', 'claude-3-haiku', 'titan-text-express', 'llama-3-8b'] },
        { id: 'custom', name: 'Custom API', models: ['default'] },
    ];

    const tabs = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'security', label: 'Security & Roles', icon: Shield },
        { id: 'integrations', label: 'Integrations', icon: Plug },
        { id: 'ai', label: 'AI Configuration', icon: Sparkles },
    ];

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-error-100 text-error-700';
            case 'coordinator': return 'bg-primary-100 text-primary-700';
            case 'technician': return 'bg-success-100 text-success-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900">Admin Settings</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AdminTab)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                            ${activeTab === tab.id
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="m-0 text-lg font-semibold text-neutral-900">Team Members</h3>
                        <Button variant="primary" icon={<Plus size={16} />}>
                            Add User
                        </Button>
                    </div>
                    <Card>
                        <CardBody className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200">
                                        <th className="p-3 font-semibold text-neutral-600">Name</th>
                                        <th className="p-3 font-semibold text-neutral-600">Email</th>
                                        <th className="p-3 font-semibold text-neutral-600">Role</th>
                                        <th className="p-3 font-semibold text-neutral-600">Status</th>
                                        <th className="p-3 font-semibold text-neutral-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_USERS.map((user) => {
                                        return (
                                            <tr key={user.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                                                <td className="p-3 font-medium text-neutral-900">{user.name}</td>
                                                <td className="p-3 text-neutral-500">{user.email}</td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-success-500' : 'bg-neutral-400'}`} />
                                                        <span className="capitalize text-neutral-700">{user.status}</span>
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button className="p-1 text-neutral-500 hover:text-primary-600 transition-colors">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button className="p-1 text-neutral-500 hover:text-error-600 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div>
                    <h3 className="mb-4 text-lg font-semibold text-neutral-900">Role Permissions</h3>
                    <Card>
                        <CardBody className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 bg-neutral-50">
                                        <th className="p-3 text-left font-semibold text-neutral-600">Permission</th>
                                        <th className="p-3 text-center font-semibold text-neutral-600">Admin</th>
                                        <th className="p-3 text-center font-semibold text-neutral-600">Coordinator</th>
                                        <th className="p-3 text-center font-semibold text-neutral-600">Technician</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['create_jobs', 'edit_jobs', 'delete_jobs', 'view_jobs', 'update_status', 'upload_files', 'add_comments', 'manage_users', 'view_reports', 'manage_settings', 'ai_config', 'assign_jobs'].map((perm) => (
                                        <tr key={perm} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                                            <td className="p-3 font-medium text-neutral-900 capitalize">
                                                {perm.replace(/_/g, ' ')}
                                            </td>
                                            {['admin', 'coordinator', 'technician'].map((role) => (
                                                <td key={role} className="p-3 text-center">
                                                    {ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].includes(perm) ? (
                                                        <Check size={18} className="mx-auto text-success-500" />
                                                    ) : (
                                                        <span className="text-neutral-300">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <div>
                    <h3 className="mb-4 text-lg font-semibold text-neutral-900">Connected Services</h3>
                    <div className="grid gap-4">
                        {[
                            { name: 'Microsoft Dataverse', status: 'not_connected', icon: '🔷', description: 'Power Platform / CRM data sync' },
                            { name: 'Dynamics 365', status: 'not_connected', icon: '📊', description: 'Business Central / F&O integration' },
                            { name: 'SAP', status: 'not_connected', icon: '🏢', description: 'ERP integration for financials and operations' },
                            { name: 'QuickBooks', status: 'not_connected', icon: '📗', description: 'Accounting and invoicing sync' },
                            { name: 'Google Maps', status: 'connected', icon: '🗺️', description: 'Address lookup and site mapping' },
                            { name: 'Xero Accounting', status: 'not_connected', icon: '💰', description: 'Invoice sync and financial reporting' },
                            { name: 'Twilio SMS', status: 'not_connected', icon: '📱', description: 'SMS notifications to technicians' },
                            { name: 'Firebase', status: 'connected', icon: '🔥', description: 'Authentication and database' },
                            { name: 'Custom REST API', status: 'not_connected', icon: '🔌', description: 'Connect any REST endpoint' },
                        ].map((integration) => (
                            <Card key={integration.name}>
                                <CardBody>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{integration.icon}</span>
                                            <div>
                                                <p className="m-0 font-medium text-neutral-900">{integration.name}</p>
                                                <p className="m-0 text-sm text-neutral-500">
                                                    {integration.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant={integration.status === 'connected' ? 'secondary' : 'primary'}
                                            size="sm"
                                        >
                                            {integration.status === 'connected' ? 'Configure' : 'Connect'}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    <h3 className="mt-6 mb-4 text-lg font-semibold text-neutral-900">API & Webhooks</h3>
                    <Card>
                        <CardBody>
                            <div className="mb-4">
                                <label className="block mb-1 text-sm font-medium text-neutral-700">
                                    API Key
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value="sk_live_xxxxxxxxxxxx"
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 font-mono text-sm"
                                    />
                                    <Button variant="secondary">Regenerate</Button>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-neutral-700">
                                    Webhook URL
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://your-system.com/webhook"
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* AI Configuration Tab */}
            {activeTab === 'ai' && (
                <div>
                    <h3 className="mb-4 text-lg font-semibold text-neutral-900">AI Assistant Configuration</h3>

                    <Card className="mb-4">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="m-0 font-medium text-neutral-900">Enable AI Assistant</p>
                                    <p className="m-0 text-sm text-neutral-500">
                                        Allow AI to provide suggestions and auto-complete tasks
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAiEnabled(!aiEnabled)}
                                    className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${aiEnabled ? 'bg-primary-500' : 'bg-neutral-300'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${aiEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="mb-4 space-y-3">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-neutral-700">
                                        AI Provider
                                    </label>
                                    <select
                                        value={aiProvider}
                                        onChange={(e) => {
                                            setAiProvider(e.target.value);
                                            const provider = AI_PROVIDERS.find(p => p.id === e.target.value);
                                            if (provider) setAiModel(provider.models[0]);
                                        }}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    >
                                        {AI_PROVIDERS.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-neutral-700">
                                        Model
                                    </label>
                                    <select
                                        value={aiModel}
                                        onChange={(e) => setAiModel(e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    >
                                        {AI_PROVIDERS.find(p => p.id === aiProvider)?.models.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {aiProvider === 'custom' && (
                                <div className="mb-4">
                                    <label className="block mb-1 text-sm font-medium text-neutral-700">
                                        Custom API Endpoint
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="https://your-ai-api.com/v1/chat"
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    />
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h4 className="m-0 font-medium text-neutral-900">System Prompt Template</h4>
                                <Button variant="primary" size="sm" icon={<Save size={14} />}>
                                    Save Changes
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                rows={10}
                                className="w-full p-3 border border-neutral-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <p className="mt-2 text-sm text-neutral-500">
                                This prompt guides the AI assistant behavior. Variables like {'{job_status}'} and {'{user_role}'} will be replaced at runtime.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
