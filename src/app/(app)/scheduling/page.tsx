import { JobListPage } from '@/components/job-list-page';

export default function SchedulingPage() {
    return (
        <JobListPage
            title="Scheduling Phase"
            currentStep="scheduling"
            emptyMessage="No jobs currently in scheduling."
        />
    );
}
