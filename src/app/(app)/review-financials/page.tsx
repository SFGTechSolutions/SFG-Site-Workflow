
import { JobListPage } from '@/components/job-list-page';

export default function ReviewFinancialsPage() {
    return (
        <JobListPage
            title="Review & Financials"
            currentStep="review_financials"
            emptyMessage="No jobs currently in review & financials."
        />
    );
}
