
import { JobListPage } from '@/components/job-list-page';

export default function JobInitiationPage() {
    return (
        <JobListPage
            title="Job Initiation"
            currentStep="job_initiation"
            emptyMessage="No jobs currently in initiation."
        />
    );
}
