import { UnifiedAiReport } from '../types/listing';

/**
 * A simple bridge to pass data between screens when standard navigation params 
 * might cause stack issues or unwanted re-renders/new instances.
 */
class AiBridge {
    private appliedReport: UnifiedAiReport | null = null;

    setReport(report: UnifiedAiReport) {
        this.appliedReport = report;
    }

    popReport(): UnifiedAiReport | null {
        const report = this.appliedReport;
        this.appliedReport = null;
        return report;
    }
}

export const aiBridge = new AiBridge();
