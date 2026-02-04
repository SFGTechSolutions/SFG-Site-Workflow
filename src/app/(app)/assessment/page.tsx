
import { JobListPage } from '@/components/job-list-page';

export default function AssessmentPage() {
    return (
        <JobListPage
            title="Assessment Phase"
            currentStep="assessment"
            emptyMessage="No jobs currently in assessment."
        />
    );
}
