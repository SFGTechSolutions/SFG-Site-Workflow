// Reports Page - Demo Reports Dashboard

'use client';

import { useState } from 'react';
import {
    FileText,
    Download,
    Calendar,
    BarChart3,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';
import { useJobs } from '@/lib/hooks';

type ReportType = 'summary' | 'defects' | 'financials' | 'productivity';

export default function ReportsPage() {
    const { jobs } = useJobs();
    const [selectedReport, setSelectedReport] = useState<ReportType>('summary');
    const [dateRange, setDateRange] = useState('30');

    const stats = {
        totalJobs: jobs.length,
        completed: jobs.filter(j => j.status === 'JOB_CLOSED').length,
        inProgress: jobs.filter(j => !['JOB_CLOSED', 'INITIATED'].includes(j.status)).length,
        blocked: jobs.filter(j => ['AWAITING_INFO', 'ACCESS_ISSUE', 'WORK_STOPPED'].includes(j.status)).length,
    };

    const exportData = (format: 'json' | 'csv') => {
        const dataStr = format === 'json'
            ? JSON.stringify(jobs, null, 2)
            : [
                'ID,Client,Status,Created',
                ...jobs.map(j => `${j.id},${j.clientName},${j.status},${j.createdAt.toISOString()}`)
            ].join('\n');

        const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobs-export-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const reports = [
        { id: 'summary', label: 'Job Summary', icon: BarChart3, description: 'Overview of all jobs' },
        { id: 'defects', label: 'Defect Report', icon: AlertTriangle, description: 'Issues and failures' },
        { id: 'financials', label: 'Financial Summary', icon: TrendingUp, description: 'Invoicing overview' },
        { id: 'productivity', label: 'Productivity', icon: Clock, description: 'Team performance' },
    ];

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-neutral-900">Reports & Exports</h1>
                <div className="flex gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Download size={16} />} onClick={() => exportData('csv')}>
                        Export CSV
                    </Button>
                    <Button variant="secondary" icon={<Download size={16} />} onClick={() => exportData('json')}>
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold m-0">
                                    {stats.totalJobs}
                                </p>
                                <p className="text-sm text-neutral-500 m-0">
                                    Total Jobs
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md bg-success-100 flex items-center justify-center text-success-600">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold m-0">
                                    {stats.completed}
                                </p>
                                <p className="text-sm text-neutral-500 m-0">
                                    Completed
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md bg-info-100 flex items-center justify-center text-info-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold m-0">
                                    {stats.inProgress}
                                </p>
                                <p className="text-sm text-neutral-500 m-0">
                                    In Progress
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md bg-warning-100 flex items-center justify-center text-warning-600">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold m-0">
                                    {stats.blocked}
                                </p>
                                <p className="text-sm text-neutral-500 m-0">
                                    Blocked
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Report Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {reports.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id as ReportType)}
                        className={`p-4 border rounded-lg text-left transition-colors ${selectedReport === report.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-neutral-200 bg-white hover:bg-neutral-50'
                            }`}
                    >
                        <report.icon
                            size={24}
                            className={`mb-2 ${selectedReport === report.id ? 'text-primary-600' : 'text-neutral-400'}`}
                        />
                        <p className="font-medium m-0">{report.label}</p>
                        <p className="text-sm text-neutral-500 m-0">
                            {report.description}
                        </p>
                    </button>
                ))}
            </div>

            {/* Report Preview */}
            <Card>
                <CardHeader>
                    <h3 className="m-0 text-lg font-semibold text-neutral-900">
                        {reports.find(r => r.id === selectedReport)?.label} Preview
                    </h3>
                </CardHeader>
                <CardBody>
                    {selectedReport === 'summary' && (
                        <div>
                            <p className="text-neutral-600 mb-4">
                                Job completion summary for the selected period.
                            </p>
                            <div className="flex gap-2 h-[200px] items-end">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                    <div key={day} className="flex-1 text-center">
                                        <div
                                            className="bg-primary-500 rounded-t-sm mb-2 w-full"
                                            style={{
                                                height: `${Math.random() * 150 + 20}px`,
                                            }}
                                        />
                                        <span className="text-xs text-neutral-500">{day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedReport === 'defects' && (
                        <div>
                            <p className="text-neutral-600 mb-4">
                                No defects reported in the selected period.
                            </p>
                            <div className="p-8 text-center bg-success-50 rounded-lg">
                                <CheckCircle size={48} className="text-success-500 mb-2 mx-auto" />
                                <p className="m-0 font-medium text-success-700">
                                    All Clear!
                                </p>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'financials' && (
                        <div>
                            <p className="text-neutral-600 mb-4">
                                Financial summary (demo data).
                            </p>
                            <div className="grid gap-3">
                                <div className="flex justify-between p-3 bg-neutral-50 rounded-md">
                                    <span>Total Invoiced</span>
                                    <strong>$45,230.00</strong>
                                </div>
                                <div className="flex justify-between p-3 bg-neutral-50 rounded-md">
                                    <span>Paid</span>
                                    <strong className="text-success-600">$38,500.00</strong>
                                </div>
                                <div className="flex justify-between p-3 bg-neutral-50 rounded-md">
                                    <span>Outstanding</span>
                                    <strong className="text-warning-600">$6,730.00</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'productivity' && (
                        <div>
                            <p className="text-neutral-600 mb-4">
                                Team productivity metrics (demo data).
                            </p>
                            <div className="grid gap-3">
                                <div className="p-3 bg-neutral-50 rounded-md">
                                    <div className="flex justify-between mb-2">
                                        <span>Avg. Time to Complete</span>
                                        <strong>4.2 days</strong>
                                    </div>
                                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-500 rounded-full w-[68%]" />
                                    </div>
                                </div>
                                <div className="p-3 bg-neutral-50 rounded-md">
                                    <div className="flex justify-between mb-2">
                                        <span>First-Time Resolution</span>
                                        <strong>87%</strong>
                                    </div>
                                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-success-500 rounded-full w-[87%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
