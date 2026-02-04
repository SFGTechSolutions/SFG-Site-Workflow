// UI Components

'use client';

import React, { ReactNode } from 'react';
import {
    Check,
    AlertTriangle,
    Clock,
    FileText,
    Mail,
    Sparkles,
    X,
    ChevronRight,
    Trash2,
} from 'lucide-react';
import { WorkflowState, WorkflowStep, StatusType, getStatusType, getStateLabel, WORKFLOW_STEPS, Finding, Defect } from '../lib/types';

// ============================================
// STATUS PILL
// ============================================

interface StatusPillProps {
    status: WorkflowState | StatusType;
    label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
    const statusType: StatusType =
        ['draft', 'in-progress', 'blocked', 'completed', 'overdue', 'pending'].includes(status as StatusType)
            ? (status as StatusType)
            : getStatusType(status as WorkflowState);

    const displayLabel = label || (statusType === status ? status : getStateLabel(status as WorkflowState));

    const styles = {
        draft: 'bg-neutral-100 text-neutral-600',
        'in-progress': 'bg-primary-100 text-primary-700',
        blocked: 'bg-accent-red-light text-accent-red',
        completed: 'bg-success-light text-success',
        overdue: 'bg-accent-red-light text-accent-red',
        pending: 'bg-warning-light text-warning',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide ${styles[statusType] || styles.draft}`}>
            {statusType === 'completed' && <Check size={12} />}
            {statusType === 'blocked' && <AlertTriangle size={12} />}
            {statusType === 'pending' && <Clock size={12} />}
            {displayLabel}
        </span>
    );
}

// ============================================
// WORKFLOW STEPPER
// ============================================

interface WorkflowStepperProps {
    currentStep: WorkflowStep;
    currentState: WorkflowState;
}

export function WorkflowStepper({ currentStep, currentState }: WorkflowStepperProps) {
    const currentIndex = WORKFLOW_STEPS.findIndex((step) => step.id === currentStep);
    const isError = ['AWAITING_INFO', 'ACCESS_ISSUE', 'WORK_STOPPED', 'INVOICE_DISPUTED', 'DOCS_RETURNED'].includes(currentState);

    return (
        <div className="flex items-center gap-0 py-4 overflow-x-auto w-full">
            {WORKFLOW_STEPS.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;

                return (
                    <div key={step.id} className={`flex flex-col items-center flex-1 min-w-[100px] relative ${isActive ? 'text-primary-700 font-semibold' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 z-10 transition-colors
                            ${isCompleted ? 'bg-success border-success text-white' :
                                isActive ? 'bg-primary-600 border-primary-600 text-white animate-pulse' :
                                    'bg-white border-neutral-300 text-neutral-400'}`}>
                            {isCompleted ? <Check size={16} /> : index + 1}
                        </div>
                        <span className={`mt-2 text-xs font-medium text-center max-w-[80px] ${isActive ? 'text-primary-700' : 'text-neutral-500'}`}>
                            {step.label}
                        </span>
                        {index < WORKFLOW_STEPS.length - 1 && (
                            <div className={`absolute top-[15px] left-[calc(50%+16px)] w-[calc(100%-32px)] h-[2px] 
                                ${index < currentIndex ? 'bg-success' : 'bg-neutral-300'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// TIMELINE
// ============================================

interface TimelineEvent {
    id: string;
    title: string;
    description?: string;
    timestamp: Date;
    type: 'default' | 'success' | 'warning' | 'error';
    user?: string;
}

interface TimelineProps {
    events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-AU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="relative pl-8">
            <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-neutral-200" />
            {events.map((event) => {
                const markerColors = {
                    default: 'bg-primary-600 ring-primary-600',
                    success: 'bg-success ring-success',
                    warning: 'bg-warning ring-warning',
                    error: 'bg-accent-red ring-accent-red',
                };

                return (
                    <div key={event.id} className="relative pb-6 last:pb-0">
                        <div className={`absolute -left-[28px] w-4 h-4 rounded-full border-2 border-white ring-2 ${markerColors[event.type]}`} />
                        <div className="bg-white border border-neutral-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-primary-900">{event.title}</span>
                                <span className="text-xs text-neutral-500">{formatTime(event.timestamp)}</span>
                            </div>
                            {event.description && (
                                <p className="text-sm text-neutral-600 mb-0">{event.description}</p>
                            )}
                            {event.user && (
                                <p className="text-sm text-neutral-400 mt-1">
                                    By {event.user}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// DECISION MODAL
// ============================================

interface DecisionModalProps {
    isOpen: boolean;
    question: string;
    yesLabel?: string;
    noLabel?: string;
    onYes: () => void;
    onNo: () => void;
    onClose: () => void;
    loading?: boolean;
}

export function DecisionModal({
    isOpen,
    question,
    yesLabel = 'Yes',
    noLabel = 'No',
    onYes,
    onNo,
    onClose,
    loading = false,
}: DecisionModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-[1040] transition-opacity duration-200 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            />
            <div
                className={`
                    fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    bg-white rounded-xl shadow-xl z-[1050] w-full max-w-[500px] max-h-[90vh] overflow-y-auto 
                    transition-all duration-200
                    ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}
                `}
            >
                <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center bg-primary-50">
                    <h3 className="text-lg font-semibold">Decision Required</h3>
                    <button
                        className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-xl font-semibold text-primary-900 text-center mb-6">{question}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className="p-5 text-lg font-semibold rounded-xl transition-all border border-transparent flex flex-col items-center justify-center gap-2 bg-success text-white hover:bg-green-600 hover:-translate-y-0.5"
                            onClick={onYes}
                            disabled={loading}
                        >
                            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={24} />}
                            {yesLabel}
                        </button>
                        <button
                            className="p-5 text-lg font-semibold rounded-xl transition-all border-2 border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:-translate-y-0.5 flex flex-col items-center justify-center gap-2"
                            onClick={onNo}
                            disabled={loading}
                        >
                            <X size={24} />
                            {noLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ============================================
// AI CARD
// ============================================

interface AICardProps {
    title: string;
    children: ReactNode;
    type?: 'info' | 'warning' | 'success';
    icon?: ReactNode;
}

export function AICard({ title, children, type = 'info', icon }: AICardProps) {
    const styles = {
        info: 'bg-info-light border-info text-info-700',
        warning: 'bg-warning-light border-warning text-warning-700',
        success: 'bg-success-light border-success text-success-700',
    };

    const cardClass = type === 'warning'
        ? 'bg-warning-light border-l-4 border-warning'
        : type === 'success'
            ? 'bg-success-light border-l-4 border-success'
            : 'bg-info-light border-l-4 border-info';

    return (
        <div className={`p-4 rounded-lg flex gap-3 ${cardClass}`}>
            <div className="mt-0.5 text-current opacity-80">
                {icon || <Sparkles size={16} />}
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1 text-primary-900">{title}</h4>
                <div className="text-sm text-neutral-700">{children}</div>
            </div>
        </div>
    );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
    icon: ReactNode;
    value: number | string;
    label: string;
    colorClass?: 'blue' | 'green' | 'amber' | 'red';
}

export function StatCard({ icon, value, label, colorClass = 'blue' }: StatCardProps) {
    const colors = {
        blue: 'bg-primary-100 text-primary-600',
        green: 'bg-success-light text-success',
        amber: 'bg-warning-light text-warning',
        red: 'bg-accent-red-light text-accent-red',
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[colorClass]}`}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-primary-900">{value}</div>
                <div className="text-sm text-neutral-500 font-medium">{label}</div>
            </div>
        </div>
    );
}

// ============================================
// CARD
// ============================================

interface CardProps {
    children: ReactNode;
    className?: string;
    elevated?: boolean;
    style?: React.CSSProperties;
}

export function Card({ children, className = '', elevated = false, style }: CardProps) {
    return (
        <div className={`bg-white rounded-xl border border-neutral-200 overflow-hidden ${elevated ? 'shadow-md border-0' : ''} ${className}`} style={style}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    action?: ReactNode;
}

export function CardHeader({ children, action }: CardHeaderProps) {
    return (
        <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center bg-white">
            <div>{children}</div>
            {action && <div>{action}</div>}
        </div>
    );
}

interface CardBodyProps {
    children: ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export function CardBody({ children, style, className = '' }: CardBodyProps) {
    return <div className={`p-6 ${className}`} style={style}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
    return <div className="card-footer">{children}</div>;
}

// ============================================
// BUTTON
// ============================================

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: ReactNode;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
    className?: string;
    style?: React.CSSProperties;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    style,
}: ButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-3 text-sm',
        lg: 'px-6 py-4 text-base',
    };

    const variantClasses = {
        primary: 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700',
        secondary: 'bg-white text-primary-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400',
        ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-primary-700 border-transparent',
    };

    return (
        <button
            type={type}
            className={`
                inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all whitespace-nowrap
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
                ${className}
            `}
            onClick={onClick}
            disabled={disabled || loading}
            style={style}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : icon ? (
                <>
                    {icon}
                    {children}
                </>
            ) : (
                children
            )}
        </button>
    );
}

// ============================================
// AVATAR
// ============================================

interface AvatarProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    return (
        <div className={`rounded-full bg-neutral-200 flex items-center justify-center font-medium text-neutral-600 overflow-hidden ${sizeClasses[size]}`}>
            {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
        </div>
    );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
            <div className="text-neutral-400 mb-4 bg-white p-4 rounded-full shadow-sm">{icon}</div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
            <p className="text-sm text-neutral-500 max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}

// ============================================
// JOB ROW
// ============================================

interface JobRowProps {
    id: string;
    workOrderRef: string;
    clientName: string;
    status: WorkflowState;
    currentStep: WorkflowStep;
    scheduledDate?: Date;
    onClick: () => void;
    onDelete?: (e: React.MouseEvent) => void;
}

export function JobRow({ workOrderRef, clientName, status, currentStep, scheduledDate, onClick, onDelete }: JobRowProps) {
    const step = WORKFLOW_STEPS.find((s) => s.id === currentStep);

    const formatDate = (date?: Date) => {
        if (!date) return '—';
        return new Intl.DateTimeFormat('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    return (
        <tr onClick={onClick} className="cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 group">
            <td className="p-4 align-middle">
                <strong className="text-neutral-900 font-medium text-sm sm:text-base">{workOrderRef}</strong>
            </td>
            <td className="p-4 align-middle text-neutral-700 text-sm sm:text-base">{clientName}</td>
            <td className="p-4 align-middle hidden sm:table-cell">
                <StatusPill status={status} />
            </td>
            <td className="p-4 align-middle text-sm text-neutral-600 font-medium hidden md:table-cell">{step?.label || currentStep}</td>
            <td className="p-4 align-middle text-sm text-neutral-500 hidden lg:table-cell">{formatDate(scheduledDate)}</td>
            <td className="p-4 align-middle">
                <div className="flex items-center gap-2">
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                            className="p-1 text-neutral-400 hover:text-accent-red hover:bg-accent-red-light rounded transition-colors"
                            title="Delete job"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <ChevronRight size={16} className="text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </div>
            </td>
        </tr>
    );
}

// ============================================
// LOADING SKELETON
// ============================================

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full border-collapse">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                        <th className="p-4 text-left"><div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" /></th>
                        <th className="p-4 text-left"><div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" /></th>
                        <th className="p-4 text-left hidden sm:table-cell"><div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" /></th>
                        <th className="p-4 text-left hidden md:table-cell"><div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" /></th>
                        <th className="p-4 text-left hidden lg:table-cell"><div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" /></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i} className="bg-white">
                            <td className="p-4"><div className="h-4 bg-neutral-100 rounded w-24 animate-pulse" /></td>
                            <td className="p-4"><div className="h-4 bg-neutral-100 rounded w-36 animate-pulse" /></td>
                            <td className="p-4 hidden sm:table-cell"><div className="h-4 bg-neutral-100 rounded w-16 animate-pulse" /></td>
                            <td className="p-4 hidden md:table-cell"><div className="h-4 bg-neutral-100 rounded w-20 animate-pulse" /></td>
                            <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-neutral-100 rounded w-24 animate-pulse" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================
// BADGE
// ============================================

interface BadgeProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    style?: React.CSSProperties;
}

export function Badge({ children, variant = 'secondary', style }: BadgeProps) {
    const variantStyles = {
        primary: 'bg-primary-100 text-primary-700',
        secondary: 'bg-neutral-100 text-neutral-700',
        success: 'bg-success-light text-success-700',
        warning: 'bg-warning-light text-warning-700',
        error: 'bg-accent-red-light text-accent-red',
    };

    return (
        <span
            className={`
                inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                ${variantStyles[variant]}
            `}
            style={style}
        >
            {children}
        </span>
    );
}
