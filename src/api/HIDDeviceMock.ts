type InputReportListener = (event: {
  data: DataView;
  reportId: number;
}) => void;

export class MockHIDDevice {
  opened = false;
  reports: { reportId: number; data: Uint8Array }[] = [];
  eventListeners: Record<string, InputReportListener[]> = {};

  async open() {
    this.opened = true;
  }

  async close() {
    this.opened = false;
  }

  async sendReport(reportId: number, data: Uint8Array) {
    this.reports.push({ reportId, data });

    setTimeout(() => {
      this.simulateInputReport(data, reportId);
    }, 50);
  }

  addEventListener(event: string, listener: InputReportListener) {
    this.eventListeners[event] ||= [];
    this.eventListeners[event].push(listener);
  }

  removeEventListener(event: string, listener: InputReportListener) {
    this.eventListeners[event] = (this.eventListeners[event] || []).filter(
      (l) => l !== listener,
    );
  }

  simulateInputReport(data: Uint8Array, reportId = 1) {
    const handlers = this.eventListeners["inputreport"];
    if (handlers) {
      const event = { data: new DataView(data.buffer), reportId };
      handlers.forEach((h) => h(event));
    }
  }
}
