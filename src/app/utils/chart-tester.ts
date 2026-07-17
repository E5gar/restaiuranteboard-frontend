// Auxiliar que se eliminará a futura entrega final
export class ChartTester {
  static logPayload(tabName: string, payload: any): void {
    console.warn(`DATA API RECIBIDA (${tabName}):`, payload);
  }

  static logChart(chartId: string, config: any): void {
    const labels = config.data?.labels || [];
    const data = config.data?.datasets?.[0]?.data || [];

    if (labels.length === 0 || data.length === 0) {
    }
  }
}