import { JobListPage } from '@/components/job-list-page';

export default function MobilisationPage() {
    return (
        <JobListPage
            title="Mobilisation Phase"
            currentStep="mobilisation"
            emptyMessage="No jobs currently in mobilisation."
        />
    );
}
