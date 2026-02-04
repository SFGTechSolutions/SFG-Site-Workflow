import { JobListPage } from '@/components/job-list-page';

export default function ResourcingPage() {
    return (
        <JobListPage
            title="Resourcing Phase"
            currentStep="resourcing"
            emptyMessage="No jobs currently in resourcing."
        />
    );
}
