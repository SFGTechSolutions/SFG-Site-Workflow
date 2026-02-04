import { JobListPage } from '@/components/job-list-page';

export default function CompletionPage() {
    return (
        <JobListPage
            title="Completion Phase"
            currentStep="completion"
            emptyMessage="No jobs currently in completion phase."
        />
    );
}
