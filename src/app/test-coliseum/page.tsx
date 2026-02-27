import GlobalCharts from '@/components/coliseum/pages/GlobalCharts';

export default function TestColiseumPage() {
    return (
        <div className="test-coliseum-harness">
            <div className="bg-yellow-100 p-2 text-center text-xs text-yellow-800 border-b border-yellow-200">
                🚧 E2E Test Harness: Global Charts 🚧
            </div>
            <GlobalCharts defaultTimeRange="alltime" defaultDomain="all" />
        </div>
    );
}
