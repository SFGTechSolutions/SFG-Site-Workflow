import { JobListPage } from '@/components/job-list-page';

export default function InspectionPage() {
    return (
        <JobListPage
            title="Inspection Phase"
            currentStep="inspection"
            emptyMessage="No jobs currently in inspection."
        />
    );
}
