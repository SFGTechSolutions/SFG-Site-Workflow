import { JobListPage } from '@/components/job-list-page';

export default function WorkExecutionPage() {
    return (
        <JobListPage
            title="Work Execution Phase"
            currentStep="work_execution"
            emptyMessage="No jobs currently in work execution."
        />
    );
}
