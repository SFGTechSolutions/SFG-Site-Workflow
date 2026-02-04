
import { JobListPage } from '@/components/job-list-page';

export default function CloseOutPage() {
    return (
        <JobListPage
            title="Close Out Phase"
            currentStep="close_out"
            emptyMessage="No jobs currently in close out."
        />
    );
}
