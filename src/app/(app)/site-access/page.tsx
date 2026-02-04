import { JobListPage } from '@/components/job-list-page';

export default function SiteAccessPage() {
    return (
        <JobListPage
            title="Site Access Phase"
            currentStep="site_access"
            emptyMessage="No jobs currently in site access."
        />
    );
}
